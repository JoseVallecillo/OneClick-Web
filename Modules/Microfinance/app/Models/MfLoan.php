<?php

namespace Modules\Microfinance\app\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MfLoan extends Model
{
    use SoftDeletes;

    protected $table = 'mf_loans';

    protected $fillable = [
        'loan_number','client_id','product_id','group_id','advisor_id','cycle_number',
        'amount_requested','amount_approved','disbursed_amount','origination_fee','insurance_total',
        'annual_rate','rate_calculation','payment_frequency','term_payments',
        'first_payment_date','maturity_date','principal_balance','interest_balance',
        'late_fee_balance','total_balance','days_overdue','par_category',
        'required_provision_pct','required_provision','disbursement_channel',
        'disbursement_bank','disbursement_account','disbursement_reference','disbursed_at',
        'status','purpose','collection_zone','approved_at','paid_off_at','approved_by','created_by',
    ];

    protected $casts = [
        'disbursed_at' => 'datetime',
        'approved_at'  => 'datetime',
        'paid_off_at'  => 'datetime',
        'first_payment_date' => 'date',
        'maturity_date' => 'date',
        'amount_requested' => 'decimal:2',
        'amount_approved' => 'decimal:2',
        'disbursed_amount' => 'decimal:2',
        'principal_balance' => 'decimal:2',
        'interest_balance' => 'decimal:2',
        'late_fee_balance' => 'decimal:2',
        'total_balance' => 'decimal:2',
    ];

    public static function generateNumber(): string
    {
        $year   = now()->year;
        $prefix = "MFI-{$year}-";
        $last   = static::where('loan_number', 'like', $prefix . '%')->orderByDesc('loan_number')->value('loan_number');
        $next   = $last ? ((int) substr($last, -5)) + 1 : 1;
        return $prefix . str_pad($next, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Generate amortization schedule.
     * Supports flat (add-on) and declining balance, weekly/biweekly/monthly frequencies.
     */
    public static function generateAmortizationSchedule(
        float $amount,
        float $annualRate,
        int $termPayments,
        string $rateCalculation, // 'flat' or 'declining'
        string $paymentFrequency, // 'weekly', 'biweekly', 'monthly'
        string $firstPaymentDate,
        float $insurancePct = 0
    ): array {
        $periodsPerYear = match ($paymentFrequency) {
            'weekly'   => 52,
            'biweekly' => 26,
            default    => 12, // monthly
        };
        $periodRate = $annualRate / 100 / $periodsPerYear;
        $schedule   = [];
        $balance    = $amount;
        $payDate    = Carbon::parse($firstPaymentDate);
        $interval   = match ($paymentFrequency) {
            'weekly'   => '1 week',
            'biweekly' => '2 weeks',
            default    => '1 month',
        };

        if ($rateCalculation === 'flat') {
            // Flat (add-on): interest = P * rate * term / periods, spread evenly
            $totalInterest    = $amount * ($annualRate / 100) * ($termPayments / $periodsPerYear);
            $fixedPrincipal   = round($amount / $termPayments, 2);
            $fixedInterest    = round($totalInterest / $termPayments, 2);
            $fixedInsurance   = round($amount * $insurancePct / 100 / $periodsPerYear, 2);
            $totalPayment     = $fixedPrincipal + $fixedInterest + $fixedInsurance;

            for ($i = 1; $i <= $termPayments; $i++) {
                $principal = ($i === $termPayments) ? $balance : $fixedPrincipal;
                $balance   = round($balance - $principal, 2);
                $schedule[] = [
                    'installment_number' => $i,
                    'due_date'    => $payDate->toDateString(),
                    'principal'   => $principal,
                    'interest'    => $fixedInterest,
                    'insurance'   => $fixedInsurance,
                    'total_due'   => round($principal + $fixedInterest + $fixedInsurance, 2),
                    'balance_after' => max(0, $balance),
                    'status'      => 'pending',
                ];
                $payDate->add($interval);
            }
        } else {
            // Declining balance (French-equivalent for microfinance)
            $payment = $periodRate > 0
                ? round($amount * $periodRate * pow(1 + $periodRate, $termPayments) / (pow(1 + $periodRate, $termPayments) - 1), 2)
                : round($amount / $termPayments, 2);

            for ($i = 1; $i <= $termPayments; $i++) {
                $interest   = round($balance * $periodRate, 2);
                $principal  = ($i === $termPayments) ? $balance : round($payment - $interest, 2);
                $insurance  = round($balance * $insurancePct / 100 / $periodsPerYear, 2);
                $balance    = round($balance - $principal, 2);
                $schedule[] = [
                    'installment_number' => $i,
                    'due_date'    => $payDate->toDateString(),
                    'principal'   => $principal,
                    'interest'    => $interest,
                    'insurance'   => $insurance,
                    'total_due'   => round($principal + $interest + $insurance, 2),
                    'balance_after' => max(0, $balance),
                    'status'      => 'pending',
                ];
                $payDate->add($interval);
            }
        }

        return $schedule;
    }

    /**
     * Classify PAR category from days_overdue.
     * PAR1 / PAR30 / PAR60 / PAR90 per REDCAMIF / Honduran standard.
     */
    public function classifyPar(): void
    {
        $days = $this->days_overdue;
        [$cat, $pct] = match (true) {
            $days <= 0  => ['current', 0],
            $days < 30  => ['par1',    1],
            $days < 60  => ['par30',  20],
            $days < 90  => ['par60',  50],
            default     => ['par90', 100],
        };
        $provision = round($this->principal_balance * $pct / 100, 2);
        $this->update([
            'par_category'          => $cat,
            'required_provision_pct' => $pct,
            'required_provision'    => $provision,
        ]);
    }

    /**
     * Accrue daily late fee and update balance.
     */
    public function accrueLateFee(MfLoanProduct $product): void
    {
        $today = now()->toDateString();
        if (MfLateFeeAccrual::where('loan_id', $this->id)->where('accrual_date', $today)->exists()) {
            return;
        }

        $fee = $product->late_fee_type === 'fixed_daily'
            ? $product->late_fee_value
            : round($this->principal_balance * $product->late_fee_value / 100, 2);

        MfLateFeeAccrual::create([
            'loan_id'               => $this->id,
            'accrual_date'          => $today,
            'fee_amount'            => $fee,
            'principal_balance_at'  => $this->principal_balance,
            'fee_type'              => $product->late_fee_type,
        ]);

        $this->increment('late_fee_balance', $fee);
        $this->increment('total_balance', $fee);
    }

    /**
     * Apply payment: late fees first, then interest, then principal.
     */
    public function applyPayment(float $amount, string $method, int $collectedBy): MfLoanPayment
    {
        $remaining   = $amount;
        $lateFeeApp  = 0;
        $interestApp = 0;
        $principalApp = 0;

        if ($this->late_fee_balance > 0) {
            $lateFeeApp = min($remaining, (float) $this->late_fee_balance);
            $remaining -= $lateFeeApp;
            $this->decrement('late_fee_balance', $lateFeeApp);
        }
        if ($remaining > 0 && $this->interest_balance > 0) {
            $interestApp = min($remaining, (float) $this->interest_balance);
            $remaining  -= $interestApp;
            $this->decrement('interest_balance', $interestApp);
        }
        if ($remaining > 0 && $this->principal_balance > 0) {
            $principalApp = min($remaining, (float) $this->principal_balance);
            $this->decrement('principal_balance', $principalApp);
        }

        $this->refresh();
        $this->update(['total_balance' => $this->principal_balance + $this->interest_balance + $this->late_fee_balance]);

        if ((float) $this->principal_balance <= 0) {
            $this->update(['status' => 'paid_off', 'paid_off_at' => now(), 'days_overdue' => 0, 'par_category' => 'current']);
            // Advance cycle on client + unblock group
            $this->client->increment('completed_cycles');
            if ($this->group_id) {
                $this->group->checkAndUpdateBlockStatus();
            }
        }

        $receipt = 'REC-' . now()->format('Ymd') . '-' . str_pad($this->id, 6, '0', STR_PAD_LEFT);

        return MfLoanPayment::create([
            'loan_id'           => $this->id,
            'collected_by'      => $collectedBy,
            'payment_date'      => now()->toDateString(),
            'amount'            => $amount,
            'principal_applied' => $principalApp,
            'interest_applied'  => $interestApp,
            'late_fee_applied'  => $lateFeeApp,
            'payment_method'    => $method,
            'receipt_number'    => $receipt,
        ]);
    }

    public function client(): BelongsTo   { return $this->belongsTo(MfClient::class, 'client_id'); }
    public function product(): BelongsTo  { return $this->belongsTo(MfLoanProduct::class, 'product_id'); }
    public function group(): BelongsTo    { return $this->belongsTo(MfCreditGroup::class, 'group_id'); }
    public function schedule(): HasMany   { return $this->hasMany(MfLoanSchedule::class, 'loan_id')->orderBy('installment_number'); }
    public function payments(): HasMany   { return $this->hasMany(MfLoanPayment::class, 'loan_id')->orderByDesc('payment_date'); }
    public function lateFees(): HasMany   { return $this->hasMany(MfLateFeeAccrual::class, 'loan_id'); }
    public function promises(): HasMany   { return $this->hasMany(MfPaymentPromise::class, 'loan_id'); }
    public function disbursement(): \Illuminate\Database\Eloquent\Relations\HasOne { return $this->hasOne(MfDisbursement::class, 'loan_id'); }
}
