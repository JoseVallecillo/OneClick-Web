<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\AnalyticalAccount;
use Modules\Accounting\Models\FixedAsset;
use Modules\Accounting\Models\Budget;
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

    // -------------------------------------------------------------------------
    // Reportes Analíticos
    // -------------------------------------------------------------------------

    public function analyticalBalance(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');

        $rows = $this->accounting->analyticalBalance($dateFrom, $dateTo);

        return Inertia::render('Accounting::Reports/AnalyticalBalance', [
            'rows'     => $rows,
            'filters'  => $request->only(['date_from', 'date_to']),
            'totals'   => [
                'debit'  => $rows->sum('total_debit'),
                'credit' => $rows->sum('total_credit'),
            ],
        ]);
    }

    public function analyticalLedger(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $analyticalAccountId = $request->input('analytical_account_id');
        $dateFrom            = $request->input('date_from');
        $dateTo              = $request->input('date_to');

        $lines              = $analyticalAccountId ? $this->accounting->analyticalLedger((int) $analyticalAccountId, $dateFrom, $dateTo) : [];
        $analyticalAccount  = $analyticalAccountId ? AnalyticalAccount::find($analyticalAccountId, ['id', 'code', 'name']) : null;

        return Inertia::render('Accounting::Reports/AnalyticalLedger', [
            'lines'                => $lines,
            'analyticalAccount'    => $analyticalAccount,
            'analyticalAccounts'   => AnalyticalAccount::where('active', true)->where('is_leaf', true)->orderBy('code')->get(['id', 'code', 'name']),
            'filters'              => $request->only(['analytical_account_id', 'date_from', 'date_to']),
        ]);
    }

    // -------------------------------------------------------------------------
    // Estados Financieros Honduras
    // -------------------------------------------------------------------------

    public function balanceSheet(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $dateAs = $request->input('date_as');

        $assets = $this->accounting->trialBalance(null, $dateAs)
            ->filter(fn ($row) => $row['type'] === 'asset')
            ->values();

        $liabilities = $this->accounting->trialBalance(null, $dateAs)
            ->filter(fn ($row) => $row['type'] === 'liability')
            ->values();

        $equity = $this->accounting->trialBalance(null, $dateAs)
            ->filter(fn ($row) => $row['type'] === 'equity')
            ->values();

        $totalAssets = $assets->sum('balance');
        $totalLiabilities = $liabilities->sum('balance');
        $totalEquity = $equity->sum('balance');

        return Inertia::render('Accounting::Reports/BalanceSheet', [
            'assets'           => $assets,
            'liabilities'      => $liabilities,
            'equity'           => $equity,
            'totalAssets'      => $totalAssets,
            'totalLiabilities' => $totalLiabilities,
            'totalEquity'      => $totalEquity,
            'filters'          => $request->only(['date_as']),
        ]);
    }

    public function incomeStatement(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');

        $income = $this->accounting->trialBalance($dateFrom, $dateTo)
            ->filter(fn ($row) => $row['type'] === 'income')
            ->values();

        $expenses = $this->accounting->trialBalance($dateFrom, $dateTo)
            ->filter(fn ($row) => $row['type'] === 'expense')
            ->values();

        $totalIncome = $income->sum('balance');
        $totalExpenses = $expenses->sum('balance');
        $netIncome = $totalIncome - $totalExpenses;

        return Inertia::render('Accounting::Reports/IncomeStatement', [
            'income'        => $income,
            'expenses'      => $expenses,
            'totalIncome'   => $totalIncome,
            'totalExpenses' => $totalExpenses,
            'netIncome'     => $netIncome,
            'filters'       => $request->only(['date_from', 'date_to']),
        ]);
    }

    public function fixedAssetsReport(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $assets = FixedAsset::with('account')->where('status', 'active')->get();

        $totalAcquisitionCost = $assets->sum('acquisition_cost');
        $totalAccumulatedDepreciation = $assets->sum('accumulated_depreciation');
        $totalNetBookValue = $assets->sum(fn ($asset) => $asset->netBookValue());

        return Inertia::render('Accounting::Reports/FixedAssetsReport', [
            'assets'                      => $assets,
            'totalAcquisitionCost'        => $totalAcquisitionCost,
            'totalAccumulatedDepreciation' => $totalAccumulatedDepreciation,
            'totalNetBookValue'           => $totalNetBookValue,
        ]);
    }

    public function budgetVsActual(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $budgetId = $request->input('budget_id');
        $budget = $budgetId ? Budget::with('lines.account')->find($budgetId) : null;

        $budgets = Budget::where('status', '!=', 'draft')->orderBy('date_from', 'desc')->get(['id', 'name', 'date_from', 'date_to']);

        $lines = $budget ? $budget->lines->map(fn ($line) => [
            'account_id' => $line->account_id,
            'code' => $line->account->code,
            'name' => $line->account->name,
            'budgeted' => (float) $line->budgeted_amount,
            'actual' => $line->actualAmount(),
            'variance' => $line->variance(),
            'variance_percent' => $line->budgeted_amount > 0 ? ($line->variance() / $line->budgeted_amount) * 100 : 0,
        ])->values() : [];

        return Inertia::render('Accounting::Reports/BudgetVsActual', [
            'budget'  => $budget,
            'budgets' => $budgets,
            'lines'   => $lines,
            'filters' => $request->only(['budget_id']),
        ]);
    }
}
