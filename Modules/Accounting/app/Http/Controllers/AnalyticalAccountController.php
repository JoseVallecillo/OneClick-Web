<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\AnalyticalAccount;

class AnalyticalAccountController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = AnalyticalAccount::with('account', 'parent')->withCount('children');

        if ($account = $request->input('account')) {
            $query->where('account_id', $account);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'ilike', "%{$search}%")
                  ->orWhere('name', 'ilike', "%{$search}%");
            });
        }

        $analyticalAccounts = $query->orderBy('code')->paginate(100)->withQueryString();

        return Inertia::render('Accounting::AnalyticalAccounts/Index', [
            'analyticalAccounts' => $analyticalAccounts,
            'accounts'           => Account::where('active', true)->orderBy('code')->get(['id', 'code', 'name']),
            'filters'            => $request->only(['search', 'account']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::AnalyticalAccounts/Form', [
            'parents'  => AnalyticalAccount::where('is_leaf', false)->orWhereNull('parent_id')->orderBy('code')->get(['id', 'code', 'name']),
            'accounts' => Account::where('active', true)->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'code'       => ['required', 'string', 'max:20', 'unique:account_analytical_accounts,code'],
            'name'       => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:500'],
            'account_id' => ['nullable', 'exists:account_accounts,id'],
            'parent_id'  => ['nullable', 'exists:account_analytical_accounts,id'],
            'active'     => ['boolean'],
        ]);

        if ($data['parent_id'] ?? null) {
            AnalyticalAccount::find($data['parent_id'])->update(['is_leaf' => false]);
        }

        $analyticalAccount = AnalyticalAccount::create(array_merge($data, ['is_leaf' => true]));

        return redirect()->route('accounting.analytical-accounts.create')
            ->with('success', "Cuenta analítica {$analyticalAccount->code} — {$analyticalAccount->name} creada.");
    }

    public function edit(Request $request, AnalyticalAccount $analyticalAccount): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::AnalyticalAccounts/Form', [
            'analyticalAccount' => $analyticalAccount->load('account', 'parent'),
            'parents'           => AnalyticalAccount::where('id', '!=', $analyticalAccount->id)->where('is_leaf', false)->orderBy('code')->get(['id', 'code', 'name']),
            'accounts'          => Account::where('active', true)->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    public function update(Request $request, AnalyticalAccount $analyticalAccount): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'code'        => ['required', 'string', 'max:20', "unique:account_analytical_accounts,code,{$analyticalAccount->id}"],
            'name'        => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:500'],
            'account_id'  => ['nullable', 'exists:account_accounts,id'],
            'parent_id'   => ['nullable', 'exists:account_analytical_accounts,id'],
            'active'      => ['boolean'],
        ]);

        $analyticalAccount->update($data);

        return redirect()->route('accounting.analytical-accounts.index')
            ->with('success', "Cuenta analítica {$analyticalAccount->code} actualizada.");
    }
}
