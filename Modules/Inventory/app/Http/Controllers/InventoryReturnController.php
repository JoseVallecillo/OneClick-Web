<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\InventoryReturn;
use Modules\Inventory\Models\Product;

class InventoryReturnController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = InventoryReturn::query();

        if ($state = $request->input('state')) {
            $query->where('state', $state);
        }

        if ($reason = $request->input('reason')) {
            $query->where('reason', $reason);
        }

        $returns = $query->orderBy('return_date', 'desc')->paginate(50)->withQueryString();

        return Inertia::render('Inventory::Returns/Index', [
            'returns' => $returns,
            'filters' => $request->only(['state', 'reason']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Inventory::Returns/Form', [
            'products' => Product::where('active', true)->orderBy('name')->get(['id', 'sku', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'return_date' => ['required', 'date'],
            'reason' => ['required', 'in:defective,wrong_item,customer_request,expired,other'],
            'notes' => ['nullable', 'string', 'max:500'],
            'lines' => ['required', 'array', 'min:1'],
            'lines.*.product_id' => ['required', 'exists:products,id'],
            'lines.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'lines.*.unit_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $return = InventoryReturn::create([
            'reference' => 'RET-' . time(),
            'return_date' => $data['return_date'],
            'reason' => $data['reason'],
            'notes' => $data['notes'] ?? null,
            'created_by' => auth()->id(),
        ]);

        foreach ($data['lines'] as $line) {
            $return->lines()->create([
                'product_id' => $line['product_id'],
                'quantity' => $line['quantity'],
                'unit_price' => $line['unit_price'] ?? null,
            ]);
        }

        return redirect()->route('inventory.returns.index')
            ->with('success', "Devolución {$return->reference} creada.");
    }

    public function approve(Request $request, InventoryReturn $return): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $return->update([
            'state' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->route('inventory.returns.index')
            ->with('success', 'Devolución aprobada.');
    }
}
