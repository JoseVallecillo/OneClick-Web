<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\Tax;

class AccountController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = Account::with('parent', 'tax')->withCount('children');

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'ilike', "%{$search}%")
                  ->orWhere('name', 'ilike', "%{$search}%");
            });
        }

        $accounts = $query->orderBy('code')->paginate(100)->withQueryString();

        return Inertia::render('Accounting::Accounts/Index', [
            'accounts' => $accounts,
            'filters'  => $request->only(['search', 'type']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::Accounts/Form', [
            'parents' => Account::where('is_leaf', false)->orWhereNull('parent_id')->orderBy('code')->get(['id', 'code', 'name']),
            'taxes'   => Tax::where('active', true)->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'code'           => ['required', 'string', 'max:20', 'unique:account_accounts,code'],
            'name'           => ['required', 'string', 'max:150'],
            'description'    => ['nullable', 'string', 'max:500'],
            'type'           => ['required', 'in:asset,liability,equity,income,expense'],
            'normal_balance' => ['required', 'in:debit,credit'],
            'parent_id'      => ['nullable', 'exists:account_accounts,id'],
            'tax_id'         => ['nullable', 'exists:account_taxes,id'],
            'active'         => ['boolean'],
        ]);

        if ($data['parent_id'] ?? null) {
            Account::find($data['parent_id'])->update(['is_leaf' => false]);
        }

        $account = Account::create(array_merge($data, ['is_leaf' => true]));

        return redirect()->route('accounting.accounts.create')
            ->with('success', "Cuenta {$account->code} — {$account->name} creada.");
    }

    public function edit(Request $request, Account $account): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::Accounts/Form', [
            'account' => $account->load('parent', 'tax'),
            'parents' => Account::where('id', '!=', $account->id)->where('is_leaf', false)->orderBy('code')->get(['id', 'code', 'name']),
            'taxes'   => Tax::where('active', true)->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function update(Request $request, Account $account): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'code'           => ['required', 'string', 'max:20', "unique:account_accounts,code,{$account->id}"],
            'name'           => ['required', 'string', 'max:150'],
            'description'    => ['nullable', 'string', 'max:500'],
            'type'           => ['required', 'in:asset,liability,equity,income,expense'],
            'normal_balance' => ['required', 'in:debit,credit'],
            'parent_id'      => ['nullable', 'exists:account_accounts,id'],
            'tax_id'         => ['nullable', 'exists:account_taxes,id'],
            'active'         => ['boolean'],
        ]);

        $account->update($data);

        return redirect()->route('accounting.accounts.index')
            ->with('success', "Cuenta {$account->code} actualizada.");
    }
}
