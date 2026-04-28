<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\Withholding;

class WithholdingController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = Withholding::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'ilike', "%{$search}%")
                  ->orWhere('name', 'ilike', "%{$search}%");
            });
        }

        $withholdings = $query->orderBy('code')->paginate(50)->withQueryString();

        return Inertia::render('Accounting::Withholdings/Index', [
            'withholdings' => $withholdings,
            'filters'      => $request->only(['search']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::Withholdings/Form', [
            'accounts' => Account::where('active', true)->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'code'                 => ['required', 'string', 'max:20', 'unique:account_withholdings,code'],
            'name'                 => ['required', 'string', 'max:100'],
            'description'          => ['nullable', 'string', 'max:500'],
            'type'                 => ['required', 'in:income,sales_tax,purchase_tax,other'],
            'scope'                => ['required', 'in:sales,purchases,all'],
            'rate'                 => ['required', 'numeric', 'min:0', 'max:100'],
            'account_id'           => ['nullable', 'exists:account_accounts,id'],
            'payable_account_id'   => ['nullable', 'exists:account_accounts,id'],
            'active'               => ['boolean'],
        ]);

        Withholding::create($data);

        return redirect()->route('accounting.withholdings.create')
            ->with('success', "Retención {$data['code']} creada.");
    }

    public function edit(Request $request, Withholding $withholding): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::Withholdings/Form', [
            'withholding' => $withholding,
            'accounts'    => Account::where('active', true)->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    public function update(Request $request, Withholding $withholding): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'code'                 => ['required', 'string', 'max:20', "unique:account_withholdings,code,{$withholding->id}"],
            'name'                 => ['required', 'string', 'max:100'],
            'description'          => ['nullable', 'string', 'max:500'],
            'type'                 => ['required', 'in:income,sales_tax,purchase_tax,other'],
            'scope'                => ['required', 'in:sales,purchases,all'],
            'rate'                 => ['required', 'numeric', 'min:0', 'max:100'],
            'account_id'           => ['nullable', 'exists:account_accounts,id'],
            'payable_account_id'   => ['nullable', 'exists:account_accounts,id'],
            'active'               => ['boolean'],
        ]);

        $withholding->update($data);

        return redirect()->route('accounting.withholdings.index')
            ->with('success', "Retención {$withholding->code} actualizada.");
    }
}
