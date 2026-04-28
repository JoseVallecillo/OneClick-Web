<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Accounting\Models\FixedAsset;

class FixedAssetController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = FixedAsset::with('account');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'ilike', "%{$search}%")
                  ->orWhere('name', 'ilike', "%{$search}%");
            });
        }

        $assets = $query->orderBy('code')->paginate(50)->withQueryString();

        return Inertia::render('Accounting::FixedAssets/Index', [
            'assets'  => $assets,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::FixedAssets/Form', [
            'accounts' => Account::where('active', true)->where('type', 'asset')->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'code'                  => ['required', 'string', 'max:20', 'unique:account_fixed_assets,code'],
            'name'                  => ['required', 'string', 'max:150'],
            'description'           => ['nullable', 'string', 'max:500'],
            'account_id'            => ['required', 'exists:account_accounts,id'],
            'acquisition_cost'      => ['required', 'numeric', 'min:0'],
            'acquisition_date'      => ['required', 'date'],
            'depreciation_method'   => ['required', 'in:straight_line,accelerated,units_of_production'],
            'useful_life_years'     => ['required', 'integer', 'min:1'],
            'residual_value'        => ['nullable', 'numeric', 'min:0'],
        ]);

        FixedAsset::create($data);

        return redirect()->route('accounting.fixed-assets.create')
            ->with('success', "Activo fijo {$data['code']} creado.");
    }

    public function edit(Request $request, FixedAsset $fixedAsset): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::FixedAssets/Form', [
            'asset'    => $fixedAsset,
            'accounts' => Account::where('active', true)->where('type', 'asset')->orderBy('code')->get(['id', 'code', 'name']),
        ]);
    }

    public function update(Request $request, FixedAsset $fixedAsset): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'code'                  => ['required', 'string', 'max:20', "unique:account_fixed_assets,code,{$fixedAsset->id}"],
            'name'                  => ['required', 'string', 'max:150'],
            'description'           => ['nullable', 'string', 'max:500'],
            'account_id'            => ['required', 'exists:account_accounts,id'],
            'acquisition_cost'      => ['required', 'numeric', 'min:0'],
            'acquisition_date'      => ['required', 'date'],
            'depreciation_method'   => ['required', 'in:straight_line,accelerated,units_of_production'],
            'useful_life_years'     => ['required', 'integer', 'min:1'],
            'residual_value'        => ['nullable', 'numeric', 'min:0'],
        ]);

        $fixedAsset->update($data);

        return redirect()->route('accounting.fixed-assets.index')
            ->with('success', "Activo fijo {$fixedAsset->code} actualizado.");
    }
}
