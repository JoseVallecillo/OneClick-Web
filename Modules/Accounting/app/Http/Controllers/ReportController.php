<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Services\AccountingService;

class ReportController extends Controller
{
    public function __construct(private AccountingService $accounting) {}

    // -------------------------------------------------------------------------
    // Balance de Comprobación
    // -------------------------------------------------------------------------

    public function trialBalance(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');

        $rows = $this->accounting->trialBalance($dateFrom, $dateTo);

        return Inertia::render('Accounting::Reports/TrialBalance', [
            'rows'     => $rows,
            'filters'  => $request->only(['date_from', 'date_to']),
            'totals'   => [
                'debit'  => $rows->sum('total_debit'),
                'credit' => $rows->sum('total_credit'),
            ],
        ]);
    }

    // -------------------------------------------------------------------------
    // Mayor General (General Ledger)
    // -------------------------------------------------------------------------

    public function generalLedger(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $accountId = $request->input('account_id');
        $dateFrom  = $request->input('date_from');
        $dateTo    = $request->input('date_to');

        $lines   = $accountId ? $this->accounting->generalLedger((int) $accountId, $dateFrom, $dateTo) : [];
        $account = $accountId ? Account::find($accountId, ['id', 'code', 'name', 'type']) : null;

        return Inertia::render('Accounting::Reports/GeneralLedger', [
            'lines'    => $lines,
            'account'  => $account,
            'accounts' => Account::where('active', true)->where('is_leaf', true)->orderBy('code')->get(['id', 'code', 'name']),
            'filters'  => $request->only(['account_id', 'date_from', 'date_to']),
        ]);
    }
}
