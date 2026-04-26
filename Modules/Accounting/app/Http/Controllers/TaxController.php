<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Tax;

class TaxController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $taxes = Tax::orderBy('name')->paginate(50)->withQueryString();

        return Inertia::render('Accounting::Taxes/Index', [
            'taxes' => $taxes,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::Taxes/Form');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'              => ['required', 'string', 'max:100'],
            'code'              => ['required', 'string', 'max:20', 'unique:account_taxes,code'],
            'type'              => ['required', 'in:percentage,fixed,exempt'],
            'rate'              => ['required', 'numeric', 'min:0', 'max:100'],
            'tax_scope'         => ['required', 'in:sales,purchases,all'],
            'tax_account_id'    => ['nullable', 'exists:account_accounts,id'],
            'refund_account_id' => ['nullable', 'exists:account_accounts,id'],
            'active'            => ['boolean'],
        ]);

        $tax = Tax::create($data);

        return redirect()->route('accounting.taxes.create')
            ->with('success', "Impuesto {$tax->name} creado.");
    }

    public function edit(Request $request, Tax $tax): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::Taxes/Form', [
            'tax' => $tax,
        ]);
    }

    public function update(Request $request, Tax $tax): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'              => ['required', 'string', 'max:100'],
            'code'              => ['required', 'string', 'max:20', "unique:account_taxes,code,{$tax->id}"],
            'type'              => ['required', 'in:percentage,fixed,exempt'],
            'rate'              => ['required', 'numeric', 'min:0', 'max:100'],
            'tax_scope'         => ['required', 'in:sales,purchases,all'],
            'tax_account_id'    => ['nullable', 'exists:account_accounts,id'],
            'refund_account_id' => ['nullable', 'exists:account_accounts,id'],
            'active'            => ['boolean'],
        ]);

        $tax->update($data);

        return redirect()->route('accounting.taxes.index')
            ->with('success', "Impuesto {$tax->name} actualizado.");
    }

    public function destroy(Request $request, Tax $tax): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $tax->delete();

        return redirect()->route('accounting.taxes.index')
            ->with('success', 'Impuesto eliminado.');
    }
}
