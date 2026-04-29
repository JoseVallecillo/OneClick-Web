<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\Budget;
use Modules\Accounting\Models\BudgetLine;
use Modules\Accounting\Services\AccountingAuditService;
use Modules\Accounting\Services\AccountingPermissionService;

class BudgetController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = Budget::query();

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $budgets = $query->orderBy('date_from', 'desc')->paginate(50)->withQueryString();

        return Inertia::render('Accounting::Budgets/Index', [
            'budgets' => $budgets,
            'filters' => $request->only(['status']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::Budgets/Form', [
            'accounts' => Account::where('active', true)->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();
        AccountingPermissionService::ensurePermission($request->user(), 'accounting.budgets.create');

        $data = $request->validate([
            'name'      => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:500'],
            'date_from' => ['required', 'date'],
            'date_to'   => ['required', 'date', 'after:date_from'],
            'lines'     => ['nullable', 'array'],
            'lines.*.account_id' => ['required', 'exists:account_accounts,id'],
            'lines.*.budgeted_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $budget = Budget::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'date_from' => $data['date_from'],
            'date_to' => $data['date_to'],
        ]);

        if ($data['lines'] ?? []) {
            foreach ($data['lines'] as $line) {
                BudgetLine::create([
                    'budget_id' => $budget->id,
                    'account_id' => $line['account_id'],
                    'budgeted_amount' => $line['budgeted_amount'],
                ]);
            }
        }

        AccountingAuditService::logBudgetUpdate($budget->id, [], $data, $request->user(), $request);

        return redirect()->route('accounting.budgets.index')
            ->with('success', "Presupuesto {$budget->name} creado.");
    }

    public function show(Request $request, Budget $budget): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::Budgets/Show', [
            'budget' => $budget->load('lines.account'),
        ]);
    }

    public function approve(Request $request, Budget $budget): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $budget->update(['status' => 'approved']);

        return redirect()->route('accounting.budgets.index')
            ->with('success', 'Presupuesto aprobado.');
    }
}
