<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\Journal;

class JournalController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $journals = Journal::with(['defaultDebitAccount', 'defaultCreditAccount'])
            ->withCount('moves')
            ->orderBy('name')
            ->get();

        return Inertia::render('Accounting::Journals/Index', [
            'journals' => $journals,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::Journals/Form', [
            'accounts' => Account::where('active', true)->where('is_leaf', true)->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'                     => ['required', 'string', 'max:100'],
            'code'                     => ['required', 'string', 'max:10', 'unique:account_journals,code'],
            'type'                     => ['required', 'in:sales,purchases,bank,cash,general'],
            'default_debit_account_id' => ['nullable', 'exists:account_accounts,id'],
            'default_credit_account_id' => ['nullable', 'exists:account_accounts,id'],
            'bank_account_number'      => ['nullable', 'string', 'max:50'],
            'active'                   => ['boolean'],
        ]);

        $journal = Journal::create($data);

        return redirect()->route('accounting.journals.index')
            ->with('success', "Diario {$journal->name} creado.");
    }

    public function edit(Request $request, Journal $journal): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::Journals/Form', [
            'journal'  => $journal->load('defaultDebitAccount', 'defaultCreditAccount'),
            'accounts' => Account::where('active', true)->where('is_leaf', true)->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    public function update(Request $request, Journal $journal): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'                     => ['required', 'string', 'max:100'],
            'code'                     => ['required', 'string', 'max:10', "unique:account_journals,code,{$journal->id}"],
            'type'                     => ['required', 'in:sales,purchases,bank,cash,general'],
            'default_debit_account_id' => ['nullable', 'exists:account_accounts,id'],
            'default_credit_account_id' => ['nullable', 'exists:account_accounts,id'],
            'bank_account_number'      => ['nullable', 'string', 'max:50'],
            'active'                   => ['boolean'],
        ]);

        $journal->update($data);

        return redirect()->route('accounting.journals.index')
            ->with('success', "Diario {$journal->name} actualizado.");
    }
}
