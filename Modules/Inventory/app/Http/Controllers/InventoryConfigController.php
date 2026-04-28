<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\Account;
use Modules\Inventory\Models\ProductCategory;
use Modules\Inventory\Models\UnitOfMeasure;
use Modules\Inventory\Models\Warehouse;
use Modules\Settings\Models\Branch;

class InventoryConfigController extends Controller
{
    // =========================================================================
    // Index
    // =========================================================================

    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $leafAccounts = fn(string $type) => Account::where('active', true)
            ->where('is_leaf', true)
            ->where('type', $type)
            ->orderBy('code')
            ->get(['id', 'code', 'name']);

        return Inertia::render('Inventory::Config', [
            'categories'       => ProductCategory::with([
                'accountInventory:id,code,name',
                'accountIncome:id,code,name',
                'accountCogs:id,code,name',
            ])->orderBy('name')->get(),
            'uoms'             => UnitOfMeasure::orderBy('name')->get(),
            'warehouses'       => Warehouse::with('branch')->orderBy('name')->get(),
            'branches'         => Branch::orderBy('name')->get(['id', 'name']),
            'accounts_asset'   => $leafAccounts('asset'),
            'accounts_income'  => $leafAccounts('income'),
            'accounts_expense' => $leafAccounts('expense'),
        ]);
    }

    // =========================================================================
    // Product Categories
    // =========================================================================

    public function storeCategory(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'                 => ['required', 'string', 'max:150'],
            'account_inventory_id' => ['nullable', 'exists:account_accounts,id'],
            'account_income_id'    => ['nullable', 'exists:account_accounts,id'],
            'account_cogs_id'      => ['nullable', 'exists:account_accounts,id'],
            'image_path'           => ['nullable', 'string', 'max:500'],
            'active'               => ['boolean'],
        ]);

        ProductCategory::create($data);

        return back()->with('success', 'Category created successfully.');
    }

    public function updateCategory(Request $request, ProductCategory $productCategory): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'                 => ['required', 'string', 'max:150'],
            'account_inventory_id' => ['nullable', 'exists:account_accounts,id'],
            'account_income_id'    => ['nullable', 'exists:account_accounts,id'],
            'account_cogs_id'      => ['nullable', 'exists:account_accounts,id'],
            'image_path'           => ['nullable', 'string', 'max:500'],
            'active'               => ['boolean'],
        ]);

        $productCategory->update($data);

        return back()->with('success', 'Category updated successfully.');
    }

    public function destroyCategory(Request $request, ProductCategory $productCategory): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $productCategory->delete();

        return back()->with('success', 'Category deleted successfully.');
    }

    // =========================================================================
    // Units of Measure
    // =========================================================================

    public function storeUom(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'         => ['required', 'string', 'max:100'],
            'abbreviation' => ['required', 'string', 'max:20'],
            'active'       => ['boolean'],
        ]);

        UnitOfMeasure::create($data);

        return back()->with('success', 'Unit of measure created successfully.');
    }

    public function updateUom(Request $request, UnitOfMeasure $uom): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'         => ['required', 'string', 'max:100'],
            'abbreviation' => ['required', 'string', 'max:20'],
            'active'       => ['boolean'],
        ]);

        $uom->update($data);

        return back()->with('success', 'Unit of measure updated successfully.');
    }

    public function destroyUom(Request $request, UnitOfMeasure $uom): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $uom->delete();

        return back()->with('success', 'Unit of measure deleted successfully.');
    }

    // =========================================================================
    // Warehouses
    // =========================================================================

    public function storeWarehouse(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'name'      => ['required', 'string', 'max:150'],
            'code'      => ['required', 'string', 'max:20', 'unique:warehouses,code'],
            'active'    => ['boolean'],
        ]);

        Warehouse::create($data);

        return back()->with('success', 'Warehouse created successfully.');
    }

    public function updateWarehouse(Request $request, Warehouse $warehouse): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'name'      => ['required', 'string', 'max:150'],
            'code'      => ['required', 'string', 'max:20', "unique:warehouses,code,{$warehouse->id}"],
            'active'    => ['boolean'],
        ]);

        $warehouse->update($data);

        return back()->with('success', 'Warehouse updated successfully.');
    }

    public function destroyWarehouse(Request $request, Warehouse $warehouse): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $warehouse->delete();

        return back()->with('success', 'Warehouse deleted successfully.');
    }
}
