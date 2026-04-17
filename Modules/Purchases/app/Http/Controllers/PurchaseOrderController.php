<?php

namespace Modules\Purchases\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Contacts\Models\Contact;
use Modules\Inventory\Models\Product;
use Modules\Inventory\Models\StockMove;
use Modules\Inventory\Models\StockMoveLine;
use Modules\Inventory\Models\Warehouse;
use Modules\Purchases\Models\PurchaseOrder;
use Modules\Purchases\Models\PurchaseOrderLine;
use Modules\Settings\Models\Currency;

class PurchaseOrderController extends Controller
{
    // -------------------------------------------------------------------------
    // Index
    // -------------------------------------------------------------------------

    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = PurchaseOrder::with(['supplier', 'warehouse', 'currency', 'creator'])
            ->withCount('lines');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'ilike', "%{$search}%")
                  ->orWhereHas('supplier', function ($sq) use ($search) {
                        $sq->where('name', 'ilike', "%{$search}%");
                  });
            });
        }

        if ($supplierId = $request->input('supplier_id')) {
            $query->where('supplier_id', $supplierId);
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $orders    = $query->orderByDesc('id')->paginate(50)->withQueryString();
        $suppliers = Contact::where('is_supplier', true)->where('active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Purchases::Orders/Index', [
            'orders'    => $orders,
            'suppliers' => $suppliers,
            'filters'   => $request->only(['search', 'status', 'supplier_id', 'date_from', 'date_to']),
        ]);
    }

    // -------------------------------------------------------------------------
    // Create / Store
    // -------------------------------------------------------------------------

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Purchases::Orders/Form', [
            'suppliers'  => Contact::where('is_supplier', true)->where('active', true)->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::where('active', true)->orderBy('name')->get(['id', 'name']),
            'currencies' => Currency::where('active', true)->orderBy('name')->get(['id', 'code', 'symbol', 'name']),
            'products'   => Product::where('active', true)->where('type', 'storable')
                ->with('uom:id,abbreviation')
                ->orderBy('name')
                ->get(['id', 'sku', 'name', 'cost', 'uom_id']),
            'primaryCurrency' => Currency::where('is_primary', true)->first(['id', 'code', 'symbol']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $isDirect = $request->boolean('direct_invoice');

        $rules = [
            'supplier_id'   => ['required', 'exists:contacts,id'],
            'warehouse_id'  => ['required', 'exists:warehouses,id'],
            'currency_id'   => ['required', 'exists:currencies,id'],
            'expected_date' => ['nullable', 'date'],
            'notes'         => ['nullable', 'string', 'max:2000'],
            'lines'         => ['required', 'array', 'min:1'],
            'lines.*.product_id'  => ['required', 'exists:products,id'],
            'lines.*.qty'         => ['required', 'numeric', 'min:0.01'],
            'lines.*.unit_cost'   => ['required', 'numeric', 'min:0'],
            'lines.*.tax_rate'    => ['required', 'numeric', 'min:0', 'max:100'],
            'lines.*.description' => ['nullable', 'string', 'max:500'],
        ];

        if ($isDirect) {
            $rules['invoice_number'] = ['required', 'string', 'max:100'];
            $rules['invoice_date']   = ['required', 'date'];
            $rules['invoice_due_date'] = ['nullable', 'date'];
        }

        $data = $request->validate($rules);

        $order = DB::transaction(function () use ($data, $isDirect) {
            // 1. Create the Order
            $order = PurchaseOrder::create([
                'reference'      => PurchaseOrder::generateReference(),
                'supplier_id'    => $data['supplier_id'],
                'warehouse_id'   => $data['warehouse_id'],
                'currency_id'    => $data['currency_id'],
                'status'         => $isDirect ? 'invoiced' : 'draft',
                'expected_date'  => $data['expected_date'] ?? ($isDirect ? $data['invoice_date'] : null),
                'notes'          => $data['notes'],
                'created_by'     => Auth::id(),
                'invoice_number' => $isDirect ? $data['invoice_number'] : null,
                'invoice_date'   => $isDirect ? $data['invoice_date'] : null,
                'invoice_due_date' => $isDirect ? ($data['invoice_due_date'] ?? null) : null,
                'invoiced_at'    => $isDirect ? now() : null,
                'confirmed_at'   => $isDirect ? now() : null,
                'received_at'    => $isDirect ? now() : null,
            ]);

            foreach ($data['lines'] as $l) {
                $line = new PurchaseOrderLine([
                    'purchase_order_id' => $order->id,
                    'product_id'        => $l['product_id'],
                    'qty'               => $l['qty'],
                    'qty_received'      => $isDirect ? $l['qty'] : 0,
                    'unit_cost'         => $l['unit_cost'],
                    'tax_rate'          => $l['tax_rate'],
                    'description'       => $l['description'],
                ]);
                $line->recalculateTotals();
                $line->save();
            }

            // Recalculate order totals from lines
            $qLines           = $order->lines()->get();
            $order->subtotal  = $qLines->sum('subtotal');
            $order->tax_amount = $qLines->sum('tax_amount');
            $order->total     = $qLines->sum('total');
            $order->save();

            // 2. If direct, process stock movement immediately
            if ($isDirect) {
                $move = StockMove::create([
                    'type'              => 'in',
                    'warehouse_id'      => $order->warehouse_id,
                    'reference'         => $order->reference,
                    'notes'             => "Factura Directa: {$order->invoice_number}",
                    'moved_at'          => $data['invoice_date'],
                    'created_by'        => Auth::id(),
                    'accounting_pending' => true,
                ]);

                foreach ($order->lines as $line) {
                    StockMoveLine::create([
                        'stock_move_id' => $move->id,
                        'product_id'    => $line->product_id,
                        'qty'           => $line->qty,
                        'unit_cost'     => $line->unit_cost,
                    ]);
                }

                $move->load('lines.product');
                $move->process();

                $order->update(['stock_move_id' => $move->id]);
            }

            return $order;
        });

        $msg = $isDirect ? "Factura de compra registrada y stock actualizado." : "Orden de compra {$order->reference} creada correctamente.";
        return redirect()->route('purchases.show', $order)->with('success', $msg);
    }

    // -------------------------------------------------------------------------
    // Show
    // -------------------------------------------------------------------------

    public function show(Request $request, PurchaseOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $order->load([
            'supplier',
            'warehouse',
            'currency',
            'creator',
            'lines.product.uom',
            'stockMove',
        ]);

        return Inertia::render('Purchases::Orders/Show', [
            'order' => $order,
        ]);
    }

    // -------------------------------------------------------------------------
    // Edit / Update
    // -------------------------------------------------------------------------

    public function edit(Request $request, PurchaseOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isDraft(), 403, 'Solo se pueden editar órdenes en borrador.');

        $order->load('lines.product.uom');

        return Inertia::render('Purchases::Orders/Form', [
            'order'      => $order,
            'suppliers'  => Contact::where('is_supplier', true)->where('active', true)->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::where('active', true)->orderBy('name')->get(['id', 'name']),
            'currencies' => Currency::where('active', true)->orderBy('name')->get(['id', 'code', 'symbol', 'name']),
            'products'   => Product::where('active', true)->where('type', 'storable')
                ->with('uom:id,abbreviation')
                ->orderBy('name')
                ->get(['id', 'sku', 'name', 'cost', 'uom_id']),
            'primaryCurrency' => Currency::where('is_primary', true)->first(['id', 'code', 'symbol']),
        ]);
    }

    public function update(Request $request, PurchaseOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isDraft(), 403, 'Solo se pueden editar órdenes en borrador.');

        $data = $request->validate([
            'supplier_id'   => ['required', 'exists:contacts,id'],
            'warehouse_id'  => ['required', 'exists:warehouses,id'],
            'currency_id'   => ['required', 'exists:currencies,id'],
            'expected_date' => ['nullable', 'date'],
            'notes'         => ['nullable', 'string', 'max:2000'],
            'lines'         => ['required', 'array', 'min:1'],
            'lines.*.product_id'  => ['required', 'exists:products,id'],
            'lines.*.description' => ['nullable', 'string', 'max:500'],
            'lines.*.qty'         => ['required', 'numeric', 'min:0.01'],
            'lines.*.unit_cost'   => ['required', 'numeric', 'min:0'],
            'lines.*.tax_rate'    => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        DB::transaction(function () use ($order, $data) {
            $order->update([
                'supplier_id'   => $data['supplier_id'],
                'warehouse_id'  => $data['warehouse_id'],
                'currency_id'   => $data['currency_id'],
                'expected_date' => $data['expected_date'] ?? null,
                'notes'         => $data['notes'] ?? null,
            ]);

            // Replace all lines
            $order->lines()->delete();

            foreach ($data['lines'] as $lineData) {
                $line = new PurchaseOrderLine([
                    'purchase_order_id' => $order->id,
                    'product_id'        => $lineData['product_id'],
                    'description'       => $lineData['description'] ?? null,
                    'qty'               => $lineData['qty'],
                    'qty_received'      => 0,
                    'unit_cost'         => $lineData['unit_cost'],
                    'tax_rate'          => $lineData['tax_rate'],
                ]);
                $line->recalculateTotals();
                $line->save();
            }

            $lines             = $order->lines()->get();
            $order->subtotal   = $lines->sum('subtotal');
            $order->tax_amount = $lines->sum('tax_amount');
            $order->total      = $lines->sum('total');
            $order->save();
        });

        return redirect()->route('purchases.show', $order)
            ->with('success', "Orden {$order->reference} actualizada correctamente.");
    }

    // -------------------------------------------------------------------------
    // Destroy (only drafts)
    // -------------------------------------------------------------------------

    public function destroy(Request $request, PurchaseOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isDraft(), 403, 'Solo se pueden eliminar órdenes en borrador.');

        $ref = $order->reference;
        DB::transaction(function () use ($order) {
            $order->lines()->delete();
            $order->delete();
        });

        return redirect()->route('purchases.index')
            ->with('success', "Orden {$ref} eliminada.");
    }

    // -------------------------------------------------------------------------
    // Workflow: Draft → Confirmed
    // -------------------------------------------------------------------------

    public function confirm(Request $request, PurchaseOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isDraft(), 403, 'La orden ya no está en borrador.');

        $order->update([
            'status'       => 'confirmed',
            'confirmed_at' => now(),
        ]);

        return redirect()->route('purchases.show', $order)
            ->with('success', "Orden {$order->reference} confirmada. Ya puedes registrar la recepción.");
    }

    // -------------------------------------------------------------------------
    // Workflow: Confirmed → Received
    // -------------------------------------------------------------------------

    public function receive(Request $request, PurchaseOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isConfirmed(), 403, 'La orden debe estar confirmada para registrar la recepción.');

        $order->load(['lines.product.uom', 'supplier', 'warehouse']);

        return Inertia::render('Purchases::Orders/Receive', [
            'order' => $order,
        ]);
    }

    public function storeReceive(Request $request, PurchaseOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isConfirmed(), 403, 'La orden debe estar confirmada para registrar la recepción.');

        $data = $request->validate([
            'received_at'  => ['required', 'date'],
            'notes'        => ['nullable', 'string', 'max:2000'],
            'lines'        => ['required', 'array', 'min:1'],
            'lines.*.line_id'   => ['required', 'exists:purchase_order_lines,id'],
            'lines.*.qty_received' => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($order, $data) {
            $order->load('lines.product');

            // Build a lookup for the received quantities keyed by line id
            $receivedMap = collect($data['lines'])->keyBy('line_id');

            // Create the StockMove (type: in) for the warehouse
            $move = StockMove::create([
                'type'              => 'in',
                'warehouse_id'      => $order->warehouse_id,
                'reference'         => $order->reference,
                'notes'             => $data['notes'] ?? "Recepción de {$order->reference}",
                'moved_at'          => $data['received_at'],
                'created_by'        => Auth::id(),
                'accounting_pending' => true,
            ]);

            foreach ($order->lines as $line) {
                $entry       = $receivedMap->get($line->id);
                $qtyReceived = $entry ? (float) $entry['qty_received'] : 0;

                // Update line received quantity
                $line->qty_received = $qtyReceived;
                $line->save();

                // Only add stock move line for items actually received
                if ($qtyReceived > 0) {
                    StockMoveLine::create([
                        'stock_move_id' => $move->id,
                        'product_id'    => $line->product_id,
                        'lot_id'        => null,
                        'qty'           => $qtyReceived,
                        'unit_cost'     => $line->unit_cost,
                    ]);
                }
            }

            // Process the stock movement (increments stock_quantities)
            $move->load('lines.product');
            $move->process();

            // Transition order status
            $order->update([
                'status'       => 'received',
                'received_at'  => $data['received_at'],
                'stock_move_id' => $move->id,
            ]);
        });

        return redirect()->route('purchases.show', $order)
            ->with('success', "Recepción registrada. El stock ha sido incrementado automáticamente.");
    }

    // -------------------------------------------------------------------------
    // Workflow: Received → Invoiced
    // -------------------------------------------------------------------------

    public function invoice(Request $request, PurchaseOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isReceived(), 403, 'La orden debe estar recibida para registrar la factura.');

        $order->load(['lines.product', 'supplier', 'currency']);

        return Inertia::render('Purchases::Orders/Invoice', [
            'order' => $order,
        ]);
    }

    public function storeInvoice(Request $request, PurchaseOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isReceived(), 403, 'La orden debe estar recibida para registrar la factura.');

        $data = $request->validate([
            'invoice_number'   => ['required', 'string', 'max:100'],
            'invoice_date'     => ['required', 'date'],
            'invoice_due_date' => ['nullable', 'date', 'after_or_equal:invoice_date'],
            'notes'            => ['nullable', 'string', 'max:2000'],
        ]);

        $order->update([
            'status'           => 'invoiced',
            'invoiced_at'      => now(),
            'invoice_number'   => $data['invoice_number'],
            'invoice_date'     => $data['invoice_date'],
            'invoice_due_date' => $data['invoice_due_date'] ?? null,
            'notes'            => $data['notes'] ?? $order->notes,
        ]);

        return redirect()->route('purchases.show', $order)
            ->with('success', "Factura {$data['invoice_number']} registrada. Orden {$order->reference} completamente procesada.");
    }
}
