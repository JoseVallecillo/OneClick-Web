<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\InventoryAdjustment;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\Product;

class InventoryAdjustmentController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = InventoryAdjustment::with('warehouse');

        if ($state = $request->input('state')) {
            $query->where('state', $state);
        }

        if ($warehouse = $request->input('warehouse')) {
            $query->where('warehouse_id', $warehouse);
        }

        $adjustments = $query->orderBy('adjustment_date', 'desc')->paginate(50)->withQueryString();

        return Inertia::render('Inventory::Adjustments/Index', [
            'adjustments' => $adjustments,
            'warehouses' => Warehouse::where('active', true)->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['state', 'warehouse']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Inventory::Adjustments/Form', [
            'warehouses' => Warehouse::where('active', true)->orderBy('name')->get(['id', 'name']),
            'products' => Product::where('active', true)->orderBy('name')->get(['id', 'sku', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'adjustment_date' => ['required', 'date'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'type' => ['required', 'in:recount,loss,damage,expiry,other'],
            'reason' => ['nullable', 'string', 'max:500'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.product_id' => ['required', 'exists:products,id'],
            'lines.*.quantity_before' => ['required', 'numeric', 'min:0'],
            'lines.*.quantity_after' => ['required', 'numeric', 'min:0'],
        ]);

        $adjustment = InventoryAdjustment::create([
            'reference' => 'ADJ-' . time(),
            'adjustment_date' => $data['adjustment_date'],
            'warehouse_id' => $data['warehouse_id'],
            'type' => $data['type'],
            'reason' => $data['reason'] ?? null,
            'created_by' => auth()->id(),
        ]);

        foreach ($data['lines'] as $line) {
            $adjustment->lines()->create([
                'product_id' => $line['product_id'],
                'quantity_before' => $line['quantity_before'],
                'quantity_after' => $line['quantity_after'],
                'quantity_diff' => $line['quantity_after'] - $line['quantity_before'],
            ]);
        }

        return redirect()->route('inventory.adjustments.index')
            ->with('success', "Ajuste {$adjustment->reference} creado.");
    }

    public function approve(Request $request, InventoryAdjustment $adjustment): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $adjustment->update([
            'state' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->route('inventory.adjustments.index')
            ->with('success', 'Ajuste aprobado.');
    }
}
