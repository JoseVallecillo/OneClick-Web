<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\PhysicalCount;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\StockQuantity;

class PhysicalCountController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = PhysicalCount::with('warehouse');

        if ($state = $request->input('state')) {
            $query->where('state', $state);
        }

        $counts = $query->orderBy('count_date', 'desc')->paginate(50)->withQueryString();

        return Inertia::render('Inventory::PhysicalCounts/Index', [
            'counts' => $counts,
            'filters' => $request->only(['state']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Inventory::PhysicalCounts/Form', [
            'warehouses' => Warehouse::where('active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'count_date' => ['required', 'date'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $count = PhysicalCount::create([
            'reference' => 'CNT-' . time(),
            'count_date' => $data['count_date'],
            'warehouse_id' => $data['warehouse_id'],
            'notes' => $data['notes'] ?? null,
            'created_by' => auth()->id(),
        ]);

        $stocks = StockQuantity::where('warehouse_id', $data['warehouse_id'])
            ->with('product')
            ->get();

        foreach ($stocks as $stock) {
            $count->lines()->create([
                'product_id' => $stock->product_id,
                'system_quantity' => $stock->quantity,
            ]);
        }

        return redirect()->route('inventory.physical-counts.show', $count)
            ->with('success', "Conteo {$count->reference} iniciado.");
    }

    public function show(Request $request, PhysicalCount $count): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Inventory::PhysicalCounts/Show', [
            'count' => $count->load('warehouse', 'lines.product'),
        ]);
    }

    public function updateLine(Request $request, PhysicalCount $count): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'line_id' => ['required', 'exists:inventory_count_lines,id'],
            'counted_quantity' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $line = $count->lines()->find($data['line_id']);
        $variance = $data['counted_quantity'] - $line->system_quantity;

        $line->update([
            'counted_quantity' => $data['counted_quantity'],
            'variance' => $variance,
            'notes' => $data['notes'] ?? null,
        ]);

        return back()->with('success', 'Línea actualizada.');
    }

    public function complete(Request $request, PhysicalCount $count): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $count->update([
            'state' => 'completed',
            'completed_at' => now(),
        ]);

        return redirect()->route('inventory.physical-counts.index')
            ->with('success', 'Conteo completado.');
    }

    public function reconcile(Request $request, PhysicalCount $count): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $count->update([
            'state' => 'reconciled',
            'reconciled_at' => now(),
        ]);

        return redirect()->route('inventory.physical-counts.index')
            ->with('success', 'Conteo reconciliado.');
    }
}
