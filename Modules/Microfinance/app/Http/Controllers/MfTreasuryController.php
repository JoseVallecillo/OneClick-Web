<?php

namespace Modules\Microfinance\app\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Microfinance\app\Models\MfDisbursement;
use Modules\Microfinance\app\Models\MfLoan;
use Modules\Microfinance\app\Models\MfLoanSchedule;
use Modules\Microfinance\app\Models\MfPortfolioReconciliation;
use Modules\Microfinance\app\Models\MfReconciliationItem;

class MfTreasuryController extends Controller
{
    public function disbursements(Request $request)
    {
        $disbursements = MfDisbursement::with(['loan.client', 'loan.product'])
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->channel, fn($q, $c) => $q->where('channel', $c))
            ->when($request->date, fn($q, $d) => $q->where('disbursement_date', $d))
            ->orderByDesc('disbursement_date')
            ->paginate(25)->withQueryString();

        $pending = MfLoan::where('status', 'approved')
            ->with(['client', 'product'])
            ->get();

        return Inertia::render('Microfinance::Treasury/Disbursements', [
            'disbursements' => $disbursements,
            'pending'       => $pending,
            'filters'       => $request->only('status', 'channel', 'date'),
        ]);
    }

    public function reconciliation(Request $request)
    {
        $date = $request->date ?? now()->toDateString();
        $rec  = MfPortfolioReconciliation::with(['items.loan.client'])
            ->where('reconciliation_date', $date)
            ->where('advisor_id', $request->user()->id)
            ->first();

        return Inertia::render('Microfinance::Treasury/Reconciliation', [
            'reconciliation' => $rec,
            'date'           => $date,
        ]);
    }

    public function createReconciliation(Request $request)
    {
        $date      = $request->validate(['date' => 'required|date'])['date'];
        $advisorId = $request->user()->id;

        $rec = MfPortfolioReconciliation::firstOrCreate(
            ['advisor_id' => $advisorId, 'reconciliation_date' => $date],
            ['status' => 'draft', 'total_expected' => 0, 'total_collected' => 0, 'total_difference' => 0]
        );

        if ($rec->wasRecentlyCreated || $rec->items()->count() === 0) {
            $loans    = MfLoan::where('advisor_id', $advisorId)->whereIn('status', ['disbursed','current','delinquent'])->get();
            $items    = [];
            $expected = 0;
            foreach ($loans as $loan) {
                $due = MfLoanSchedule::where('loan_id', $loan->id)->where('due_date', $date)->where('status', '!=', 'paid')->value('total_due') ?? 0;
                if ($due <= 0 && $loan->days_overdue <= 0) continue;
                $dueAmt  = $due > 0 ? $due : $loan->principal_balance;
                $items[] = ['reconciliation_id' => $rec->id, 'loan_id' => $loan->id, 'expected_amount' => $dueAmt, 'collected_amount' => 0, 'difference' => -$dueAmt, 'status' => 'pending', 'created_at' => now(), 'updated_at' => now()];
                $expected += $dueAmt;
            }
            if (!empty($items)) { MfReconciliationItem::insert($items); }
            $rec->update(['total_expected' => $expected, 'total_difference' => -$expected]);
        }

        return redirect()->route('microfinance.treasury.reconciliation', ['date' => $date]);
    }

    public function updateReconciliationItem(Request $request, MfReconciliationItem $item)
    {
        $data = $request->validate(['collected_amount' => 'required|numeric|min:0']);

        $diff = $data['collected_amount'] - $item->expected_amount;
        $item->update(['collected_amount' => $data['collected_amount'], 'difference' => $diff, 'status' => $diff >= 0 ? 'collected' : 'partial']);

        $rec = $item->reconciliation;
        $rec->update([
            'total_collected'  => $rec->items()->sum('collected_amount'),
            'total_difference' => $rec->items()->sum('difference'),
        ]);

        // Remove duplicate totals update (done above)
        unset($rec);

        return back();
    }

    public function submitReconciliation(Request $request, MfPortfolioReconciliation $reconciliation)
    {
        $submitted = $reconciliation->items()->sum('collected_amount');
        $reconciliation->update([
            'submitted_amount' => $submitted,
            'difference'       => $submitted - $reconciliation->expected_amount,
            'status'           => 'submitted',
            'submitted_at'     => now(),
        ]);
        return back();
    }

    public function verifyReconciliation(Request $request, MfPortfolioReconciliation $reconciliation)
    {
        $data = $request->validate(['verified_amount' => 'required|numeric|min:0', 'notes' => 'nullable|string']);
        $reconciliation->update([
            'verified_amount' => $data['verified_amount'],
            'difference'      => $data['verified_amount'] - $reconciliation->expected_amount,
            'status'          => abs($data['verified_amount'] - $reconciliation->submitted_amount) < 1 ? 'verified' : 'discrepancy',
            'verified_by'     => $request->user()->id,
            'verified_at'     => now(),
            'notes'           => $data['notes'] ?? null,
        ]);
        return back();
    }
}
