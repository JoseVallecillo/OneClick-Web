<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\BankReconciliation;

class BankReconciliationController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = BankReconciliation::with('account');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $reconciliations = $query->orderBy('statement_date', 'desc')->paginate(50)->withQueryString();

        return Inertia::render('Accounting::BankReconciliations/Index', [
            'reconciliations' => $reconciliations,
            'filters'         => $request->only(['status']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::BankReconciliations/Form', [
            'accounts' => Account::where('active', true)->where('type', 'asset')->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'account_id'       => ['required', 'exists:account_accounts,id'],
            'statement_date'   => ['required', 'date'],
            'statement_balance' => ['required', 'numeric'],
            'book_balance'     => ['required', 'numeric'],
            'notes'            => ['nullable', 'string', 'max:1000'],
        ]);

        $data['difference'] = $data['statement_balance'] - $data['book_balance'];

        BankReconciliation::create($data);

        return redirect()->route('accounting.bank-reconciliations.index')
            ->with('success', 'Conciliación bancaria creada.');
    }

    public function show(Request $request, BankReconciliation $reconciliation): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::BankReconciliations/Show', [
            'reconciliation' => $reconciliation->load('account', 'items'),
        ]);
    }

    public function reconcile(Request $request, BankReconciliation $reconciliation): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $reconciliation->update([
            'status' => 'reconciled',
            'reconciled_at' => now(),
            'reconciled_by' => auth()->id(),
        ]);

        return redirect()->route('accounting.bank-reconciliations.index')
            ->with('success', 'Conciliación completada.');
    }
}
