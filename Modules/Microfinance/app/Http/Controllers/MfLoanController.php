<?php

namespace Modules\Microfinance\app\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Microfinance\app\Models\MfAmlAlert;
use Modules\Microfinance\app\Models\MfClient;
use Modules\Microfinance\app\Models\MfLoan;
use Modules\Microfinance\app\Models\MfLoanProduct;
use Modules\Microfinance\app\Models\MfLoanSchedule;

class MfLoanController extends Controller
{
    public function index(Request $request)
    {
        $query = MfLoan::with(['client', 'product'])
            ->when($request->search, fn($q, $s) => $q->where('loan_number', 'like', "%{$s}%")
                ->orWhereHas('client', fn($q) => $q->where('first_name', 'like', "%{$s}%")->orWhere('last_name', 'like', "%{$s}%")))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->par, fn($q, $p) => $q->where('par_category', $p))
            ->orderByDesc('days_overdue');

        $portfolio = MfLoan::whereIn('status', ['disbursed','current','delinquent','judicial']);

        return Inertia::render('Microfinance::Loans/Index', [
            'loans'   => $query->paginate(25)->withQueryString(),
            'filters' => $request->only('search', 'status', 'par'),
            'summary' => [
                'total_portfolio'   => $portfolio->sum('principal_balance'),
                'delinquent_count'  => MfLoan::where('par_category', '!=', 'current')->whereIn('status', ['disbursed','current','delinquent'])->count(),
                'par30_amount'      => $portfolio->whereIn('par_category', ['par30','par60','par90'])->sum('principal_balance'),
                'pending_approval'  => MfLoan::whereIn('status', ['pending','committee_review'])->count(),
            ],
        ]);
    }

    public function show(MfLoan $loan)
    {
        $loan->load(['client', 'product', 'group', 'schedule', 'payments', 'promises', 'disbursement']);

        return Inertia::render('Microfinance::Loans/Show', ['loan' => $loan]);
    }

    public function create()
    {
        return Inertia::render('Microfinance::Loans/Form', [
            'products' => MfLoanProduct::where('is_active', true)->get(),
            'clients'  => MfClient::where('status', 'active')->select('id','client_number','first_name','last_name','internal_score','monthly_payment_capacity','completed_cycles')->orderBy('first_name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'client_id'          => 'required|exists:mf_clients,id',
            'product_id'         => 'required|exists:mf_loan_products,id',
            'group_id'           => 'nullable|exists:mf_credit_groups,id',
            'amount_requested'   => 'required|numeric|min:100',
            'term_payments'      => 'required|integer|min:1',
            'first_payment_date' => 'required|date',
            'purpose'            => 'required|string|max:200',
            'collection_zone'    => 'nullable|string|max:80',
        ]);

        $product = MfLoanProduct::findOrFail($data['product_id']);
        $client  = MfClient::findOrFail($data['client_id']);

        // Validate group not blocked
        if (!empty($data['group_id'])) {
            $group = \Modules\Microfinance\app\Models\MfCreditGroup::findOrFail($data['group_id']);
            abort_if($group->is_blocked, 422, 'El grupo solidario está bloqueado por mora.');
        }

        // Cycle limit check
        $cycleLimit = $product->cycleLimitFor($client->completed_cycles + 1);
        if ($cycleLimit !== null) {
            abort_if($data['amount_requested'] > $cycleLimit, 422, "Límite del ciclo {$data['amount_requested']} excede L.{$cycleLimit}");
        }

        $fee = $product->calculateOriginationFee($data['amount_requested']);

        $loan = MfLoan::create([
            ...$data,
            'loan_number'         => MfLoan::generateNumber(),
            'advisor_id'          => $request->user()->id,
            'cycle_number'        => $client->completed_cycles + 1,
            'annual_rate'         => $product->annual_rate,
            'rate_calculation'    => $product->rate_calculation,
            'payment_frequency'   => $product->payment_frequency,
            'origination_fee'     => $fee,
            'principal_balance'   => $data['amount_requested'],
            'total_balance'       => $data['amount_requested'],
            'status'              => 'pending',
            'created_by'          => $request->user()->id,
        ]);

        return redirect()->route('microfinance.loans.show', $loan);
    }

    public function approve(Request $request, MfLoan $loan)
    {
        $data = $request->validate([
            'amount_approved' => 'required|numeric|min:100',
        ]);
        $loan->update([
            'amount_approved'  => $data['amount_approved'],
            'status'           => 'approved',
            'approved_at'      => now(),
            'approved_by'      => $request->user()->id,
            'principal_balance' => $data['amount_approved'],
            'total_balance'    => $data['amount_approved'],
        ]);
        return back();
    }

    public function disburse(Request $request, MfLoan $loan)
    {
        $data = $request->validate([
            'disbursement_channel' => 'required|in:cash,transfer,check',
            'bank_name'            => 'nullable|string|max:80',
            'account_number'       => 'nullable|string|max:60',
            'transfer_reference'   => 'nullable|string|max:80',
            'first_payment_date'   => 'required|date',
        ]);

        abort_if($loan->status !== 'approved', 422, 'El crédito no está aprobado.');

        $amount   = (float) ($loan->amount_approved ?? $loan->amount_requested);
        $schedule = MfLoan::generateAmortizationSchedule(
            $amount, $loan->annual_rate, $loan->term_payments,
            $loan->rate_calculation, $loan->payment_frequency,
            $data['first_payment_date'],
            $loan->product->insurance_pct ?? 0
        );

        $totalInterest   = array_sum(array_column($schedule, 'interest'));
        $totalInsurance  = array_sum(array_column($schedule, 'insurance'));
        $maturityDate    = end($schedule)['due_date'];

        $loan->update([
            ...$data,
            'disbursed_amount'     => $amount,
            'disbursed_at'         => now(),
            'first_payment_date'   => $data['first_payment_date'],
            'maturity_date'        => $maturityDate,
            'status'               => 'disbursed',
            'interest_balance'     => $totalInterest,
            'insurance_total'      => $totalInsurance,
            'total_balance'        => $amount + $totalInterest + $totalInsurance,
        ]);

        foreach ($schedule as $row) {
            MfLoanSchedule::create(['loan_id' => $loan->id, ...$row]);
        }

        // AML check on disbursement
        MfAmlAlert::checkAndCreate($loan->client_id, $amount, null, 'disbursement', $loan->id);

        \Modules\Microfinance\app\Models\MfDisbursement::create([
            'loan_id'            => $loan->id,
            'processed_by'       => $request->user()->id,
            'amount'             => $amount,
            'channel'            => $data['disbursement_channel'],
            'bank_name'          => $data['bank_name'] ?? null,
            'account_number'     => $data['account_number'] ?? null,
            'transfer_reference' => $data['transfer_reference'] ?? null,
            'disbursement_date'  => now()->toDateString(),
            'status'             => 'completed',
        ]);

        return back();
    }

    public function payment(Request $request, MfLoan $loan)
    {
        $data = $request->validate([
            'amount'         => 'required|numeric|min:1',
            'payment_method' => 'required|in:cash,transfer,mobile_wallet',
        ]);

        abort_if(!in_array($loan->status, ['disbursed','current','delinquent']), 422, 'El crédito no acepta pagos en este estado.');

        $loan->applyPayment($data['amount'], $data['payment_method'], $request->user()->id);

        // AML check on payment
        MfAmlAlert::checkAndCreate($loan->client_id, $data['amount'], null, 'loan_payment', $loan->id);

        return back();
    }

    public function refreshDelinquency()
    {
        $loans = MfLoan::whereIn('status', ['disbursed','current','delinquent'])->with('product')->get();

        foreach ($loans as $loan) {
            $nextDue = MfLoanSchedule::where('loan_id', $loan->id)
                ->where('status', '!=', 'paid')
                ->orderBy('due_date')
                ->value('due_date');

            $days = $nextDue ? max(0, now()->startOfDay()->diffInDays(\Carbon\Carbon::parse($nextDue), false) * -1) : 0;

            $newStatus = match (true) {
                $days <= 0    => 'current',
                $days <= 3    => 'current',
                $days <= 90   => 'delinquent',
                default       => 'delinquent',
            };

            $loan->update(['days_overdue' => max(0, $days), 'status' => $newStatus]);
            $loan->classifyPar();

            if ($days > 0) {
                $loan->accrueLateFee($loan->product);
            }

            if ($loan->group_id) {
                $loan->group->checkAndUpdateBlockStatus();
            }
        }

        return back();
    }

    public function previewAmortization(Request $request)
    {
        $request->validate([
            'amount'             => 'required|numeric|min:1',
            'annual_rate'        => 'required|numeric|min:0',
            'term_payments'      => 'required|integer|min:1',
            'rate_calculation'   => 'required|in:flat,declining',
            'payment_frequency'  => 'required|in:weekly,biweekly,monthly',
            'first_payment_date' => 'required|date',
            'insurance_pct'      => 'nullable|numeric|min:0',
        ]);

        return response()->json(MfLoan::generateAmortizationSchedule(
            (float) $request->amount,
            (float) $request->annual_rate,
            (int) $request->term_payments,
            $request->rate_calculation,
            $request->payment_frequency,
            $request->first_payment_date,
            (float) ($request->insurance_pct ?? 0)
        ));
    }
}
