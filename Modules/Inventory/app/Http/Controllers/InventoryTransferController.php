<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\InventoryTransfer;
use Modules\Inventory\Models\Warehouse;
use Modules\Inventory\Models\Product;

class InventoryTransferController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = InventoryTransfer::with('warehouseFrom', 'warehouseTo');

        if ($state = $request->input('state')) {
            $query->where('state', $state);
        }

        $transfers = $query->orderBy('transfer_date', 'desc')->paginate(50)->withQueryString();

        return Inertia::render('Inventory::Transfers/Index', [
            'transfers' => $transfers,
            'filters' => $request->only(['state']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Inventory::Transfers/Form', [
            'warehouses' => Warehouse::where('active', true)->orderBy('name')->get(['id', 'name']),
            'products' => Product::where('active', true)->orderBy('name')->get(['id', 'sku', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'transfer_date' => ['required', 'date'],
            'warehouse_from_id' => ['required', 'exists:warehouses,id'],
            'warehouse_to_id' => ['required', 'exists:warehouses,id', 'different:warehouse_from_id'],
            'reason' => ['nullable', 'string', 'max:500'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.product_id' => ['required', 'exists:products,id'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0.01'],
        ]);

        $transfer = InventoryTransfer::create([
            'reference' => 'TRF-' . time(),
            'transfer_date' => $data['transfer_date'],
            'warehouse_from_id' => $data['warehouse_from_id'],
            'warehouse_to_id' => $data['warehouse_to_id'],
            'reason' => $data['reason'] ?? null,
        ]);

        foreach ($data['lines'] as $line) {
            $transfer->lines()->create([
                'product_id' => $line['product_id'],
                'quantity_shipped' => $line['quantity'],
            ]);
        }

        return redirect()->route('inventory.transfers.index')
            ->with('success', "Transferencia {$transfer->reference} creada.");
    }

    public function ship(Request $request, InventoryTransfer $transfer): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $transfer->update([
            'state' => 'in_transit',
            'shipped_at' => now(),
        ]);

        return redirect()->route('inventory.transfers.index')
            ->with('success', 'Transferencia enviada.');
    }

    public function receive(Request $request, InventoryTransfer $transfer): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'lines' => ['required', 'array'],
            'lines.*.id' => ['required', 'exists:inventory_transfer_lines,id'],
            'lines.*.quantity_received' => ['required', 'numeric', 'min:0'],
        ]);

        foreach ($data['lines'] as $line) {
            $transfer->lines()->find($line['id'])->update([
                'quantity_received' => $line['quantity_received'],
            ]);
        }

        $transfer->update([
            'state' => 'received',
            'received_at' => now(),
        ]);

        return redirect()->route('inventory.transfers.index')
            ->with('success', 'Transferencia recibida.');
    }
}
