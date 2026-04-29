<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class MfClient extends Model
{
    use SoftDeletes;

    protected $table = 'mf_clients';

    protected $fillable = [
        'client_number','first_name','last_name','identity_number','birth_date','gender',
        'phone_mobile','phone_whatsapp','email','address','latitude','longitude',
        'business_name','business_type','business_years','monthly_revenue','monthly_expenses',
        'monthly_net_income','monthly_payment_capacity','internal_score','score_breakdown',
        'score_calculated_at','commercial_references_count','personal_references_count',
        'advisor_id','status','completed_cycles','notes','profile_photo_path',
    ];

    protected $casts = [
        'monthly_revenue'       => 'decimal:2',
        'monthly_expenses'      => 'decimal:2',
        'monthly_net_income'    => 'decimal:2',
        'monthly_payment_capacity' => 'decimal:2',
        'score_breakdown'       => 'array',
        'score_calculated_at'   => 'datetime',
        'birth_date'            => 'date',
    ];

    public static function generateNumber(): string
    {
        $year   = now()->year;
        $prefix = "CLI-{$year}-";
        $last   = static::where('client_number', 'like', $prefix . '%')->orderByDesc('client_number')->value('client_number');
        $next   = $last ? ((int) substr($last, -4)) + 1 : 1;
        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    public function fullName(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Paramétric internal score (0–100).
     * - Business activity  : 0–20
     * - Payment capacity   : 0–25  (payment_capacity / expected_installment)
     * - References verified: 0–15
     * - Completed cycles   : 0–20  (+5 per cycle, max 4)
     * - Score history bonus: 0–20  (based on on-time payments)
     */
    public function recalculateScore(float $expectedInstallment = 0): void
    {
        $breakdown = [];

        // 1. Business activity (years in business + type)
        $activityScore = min(20, ($this->business_years >= 3 ? 15 : $this->business_years * 5)
            + (in_array($this->business_type, ['pulperia', 'taller', 'manufactura']) ? 5 : 0));
        $breakdown['activity'] = $activityScore;

        // 2. Payment capacity ratio
        $capacityScore = 0;
        if ($expectedInstallment > 0 && $this->monthly_payment_capacity > 0) {
            $ratio = $this->monthly_payment_capacity / $expectedInstallment;
            $capacityScore = match (true) {
                $ratio >= 3  => 25,
                $ratio >= 2  => 20,
                $ratio >= 1.5 => 15,
                $ratio >= 1.2 => 10,
                $ratio >= 1  => 5,
                default      => 0,
            };
        }
        $breakdown['capacity'] = $capacityScore;

        // 3. Verified references
        $refScore = min(15, ($this->commercial_references_count * 4) + ($this->personal_references_count * 2));
        $breakdown['references'] = $refScore;

        // 4. Completed cycles
        $cycleScore = min(20, $this->completed_cycles * 5);
        $breakdown['cycles'] = $cycleScore;

        // 5. On-time payment history from paid loans
        $totalPaid    = $this->loans()->where('status', 'paid_off')->count();
        $onTimePaid   = $this->loans()->where('status', 'paid_off')->where('days_overdue', 0)->count();
        $historyScore = $totalPaid > 0 ? (int) round(($onTimePaid / $totalPaid) * 20) : 0;
        $breakdown['history'] = $historyScore;

        $total = $activityScore + $capacityScore + $refScore + $cycleScore + $historyScore;

        $this->update([
            'internal_score'      => min(100, $total),
            'score_breakdown'     => $breakdown,
            'score_calculated_at' => now(),
        ]);
    }

    public function loans(): HasMany      { return $this->hasMany(MfLoan::class, 'client_id'); }
    public function documents(): HasMany  { return $this->hasMany(MfClientDocument::class, 'client_id'); }
    public function references(): HasMany { return $this->hasMany(MfClientReference::class, 'client_id'); }
    public function snapshots(): HasMany  { return $this->hasMany(MfClientBusinessSnapshot::class, 'client_id'); }
    public function groupMemberships(): HasMany { return $this->hasMany(MfCreditGroupMember::class, 'client_id'); }
}
