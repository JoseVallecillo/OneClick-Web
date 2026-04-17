<?php

namespace Modules\Sales\Http\Controllers;

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
use Modules\Sales\Models\SalesOrder;
use Modules\Sales\Models\SalesOrderLine;
use Modules\Settings\Models\Currency;

class SalesOrderController extends Controller
{
    // -------------------------------------------------------------------------
    // Index
    // -------------------------------------------------------------------------

    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = SalesOrder::with(['customer', 'warehouse', 'currency', 'creator'])
            ->withCount('lines');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'ilike', "%{$search}%")
                  ->orWhere('customer_po_ref', 'ilike', "%{$search}%")
                  ->orWhereHas('customer', function ($sq) use ($search) {
                      $sq->where('name', 'ilike', "%{$search}%");
                  });
            });
        }

        if ($customerId = $request->input('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $orders    = $query->orderByDesc('id')->paginate(50)->withQueryString();
        $customers = Contact::where('is_client', true)->where('active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Sales::Orders/Index', [
            'orders'    => $orders,
            'customers' => $customers,
            'filters'   => $request->only(['search', 'status', 'customer_id', 'date_from', 'date_to']),
        ]);
    }

    // -------------------------------------------------------------------------
    // Create / Store
    // -------------------------------------------------------------------------

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Sales::Orders/Form', [
            'customers'       => Contact::where('is_client', true)->where('active', true)->orderBy('name')->get(['id', 'name']),
            'warehouses'      => Warehouse::where('active', true)->orderBy('name')->get(['id', 'name']),
            'currencies'      => Currency::where('active', true)->orderBy('name')->get(['id', 'code', 'symbol', 'name']),
            'products'        => Product::where('active', true)
                ->whereIn('type', ['storable', 'service', 'consumable'])
                ->with('uom:id,abbreviation')
                ->orderBy('name')
                ->get(['id', 'sku', 'name', 'price', 'uom_id']),
            'primaryCurrency' => Currency::where('is_primary', true)->first(['id', 'code', 'symbol']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'customer_id'     => ['required', 'exists:contacts,id'],
            'warehouse_id'    => ['required', 'exists:warehouses,id'],
            'currency_id'     => ['required', 'exists:currencies,id'],
            'delivery_date'   => ['nullable', 'date'],
            'quote_expires_at' => ['nullable', 'date'],
            'customer_po_ref' => ['nullable', 'string', 'max:100'],
            'payment_terms'   => ['nullable', 'string', 'max:50'],
            'notes'           => ['nullable', 'string', 'max:2000'],
            'lines'           => ['required', 'array', 'min:1'],
            'lines.*.product_id'  => ['required', 'exists:products,id'],
            'lines.*.qty'         => ['required', 'numeric', 'min:0.01'],
            'lines.*.unit_price'  => ['required', 'numeric', 'min:0'],
            'lines.*.tax_rate'    => ['required', 'numeric', 'min:0', 'max:100'],
            'lines.*.description' => ['nullable', 'string', 'max:500'],
        ]);

        $order = DB::transaction(function () use ($data) {
            $order = SalesOrder::create([
                'reference'       => SalesOrder::generateReference(),
                'customer_id'     => $data['customer_id'],
                'warehouse_id'    => $data['warehouse_id'],
                'currency_id'     => $data['currency_id'],
                'status'          => 'quote',
                'delivery_date'   => $data['delivery_date'] ?? null,
                'quote_expires_at' => $data['quote_expires_at'] ?? null,
                'customer_po_ref' => $data['customer_po_ref'] ?? null,
                'payment_terms'   => $data['payment_terms'] ?? null,
                'notes'           => $data['notes'] ?? null,
                'created_by'      => Auth::id(),
            ]);

            foreach ($data['lines'] as $l) {
                $line = new SalesOrderLine([
                    'sales_order_id' => $order->id,
                    'product_id'     => $l['product_id'],
                    'qty'            => $l['qty'],
                    'qty_shipped'    => 0,
                    'unit_price'     => $l['unit_price'],
                    'tax_rate'       => $l['tax_rate'],
                    'description'    => $l['description'] ?? null,
                ]);
                $line->recalculateTotals();
                $line->save();
            }

            $lines             = $order->lines()->get();
            $order->subtotal   = $lines->sum('subtotal');
            $order->tax_amount = $lines->sum('tax_amount');
            $order->total      = $lines->sum('total');
            $order->save();

            return $order;
        });

        return redirect()->route('sales.show', $order)
            ->with('success', "Cotización {$order->reference} creada correctamente.");
    }

    // -------------------------------------------------------------------------
    // Show
    // -------------------------------------------------------------------------

    public function show(Request $request, SalesOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $order->load([
            'customer',
            'warehouse',
            'currency',
            'creator',
            'lines.product.uom',
            'stockMove',
        ]);

        return Inertia::render('Sales::Orders/Show', [
            'order' => $order,
        ]);
    }

    // -------------------------------------------------------------------------
    // Edit / Update
    // -------------------------------------------------------------------------

    public function edit(Request $request, SalesOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isQuote(), 403, 'Solo se pueden editar cotizaciones en borrador.');

        $order->load('lines.product.uom');

        return Inertia::render('Sales::Orders/Form', [
            'order'           => $order,
            'customers'       => Contact::where('is_client', true)->where('active', true)->orderBy('name')->get(['id', 'name']),
            'warehouses'      => Warehouse::where('active', true)->orderBy('name')->get(['id', 'name']),
            'currencies'      => Currency::where('active', true)->orderBy('name')->get(['id', 'code', 'symbol', 'name']),
            'products'        => Product::where('active', true)
                ->whereIn('type', ['storable', 'service', 'consumable'])
                ->with('uom:id,abbreviation')
                ->orderBy('name')
                ->get(['id', 'sku', 'name', 'price', 'uom_id']),
            'primaryCurrency' => Currency::where('is_primary', true)->first(['id', 'code', 'symbol']),
        ]);
    }

    public function update(Request $request, SalesOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isQuote(), 403, 'Solo se pueden editar cotizaciones en borrador.');

        $data = $request->validate([
            'customer_id'     => ['required', 'exists:contacts,id'],
            'warehouse_id'    => ['required', 'exists:warehouses,id'],
            'currency_id'     => ['required', 'exists:currencies,id'],
            'delivery_date'   => ['nullable', 'date'],
            'quote_expires_at' => ['nullable', 'date'],
            'customer_po_ref' => ['nullable', 'string', 'max:100'],
            'payment_terms'   => ['nullable', 'string', 'max:50'],
            'notes'           => ['nullable', 'string', 'max:2000'],
            'lines'           => ['required', 'array', 'min:1'],
            'lines.*.product_id'  => ['required', 'exists:products,id'],
            'lines.*.description' => ['nullable', 'string', 'max:500'],
            'lines.*.qty'         => ['required', 'numeric', 'min:0.01'],
            'lines.*.unit_price'  => ['required', 'numeric', 'min:0'],
            'lines.*.tax_rate'    => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        DB::transaction(function () use ($order, $data) {
            $order->update([
                'customer_id'     => $data['customer_id'],
                'warehouse_id'    => $data['warehouse_id'],
                'currency_id'     => $data['currency_id'],
                'delivery_date'   => $data['delivery_date'] ?? null,
                'quote_expires_at' => $data['quote_expires_at'] ?? null,
                'customer_po_ref' => $data['customer_po_ref'] ?? null,
                'payment_terms'   => $data['payment_terms'] ?? null,
                'notes'           => $data['notes'] ?? null,
            ]);

            // Replace all lines
            $order->lines()->delete();

            foreach ($data['lines'] as $lineData) {
                $line = new SalesOrderLine([
                    'sales_order_id' => $order->id,
                    'product_id'     => $lineData['product_id'],
                    'description'    => $lineData['description'] ?? null,
                    'qty'            => $lineData['qty'],
                    'qty_shipped'    => 0,
                    'unit_price'     => $lineData['unit_price'],
                    'tax_rate'       => $lineData['tax_rate'],
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

        return redirect()->route('sales.show', $order)
            ->with('success', "Cotización {$order->reference} actualizada correctamente.");
    }

    // -------------------------------------------------------------------------
    // Destroy (only quotes)
    // -------------------------------------------------------------------------

    public function destroy(Request $request, SalesOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isQuote(), 403, 'Solo se pueden eliminar cotizaciones en borrador.');

        $ref = $order->reference;
        DB::transaction(function () use ($order) {
            $order->lines()->delete();
            $order->delete();
        });

        return redirect()->route('sales.index')
            ->with('success', "Cotización {$ref} eliminada.");
    }

    // -------------------------------------------------------------------------
    // Workflow: Quote → Confirmed
    // -------------------------------------------------------------------------

    public function confirm(Request $request, SalesOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        DB::transaction(function () use ($order) {
            $order->load('lines');

            foreach ($order->lines as $line) {
                DB::table('stock_quantities')
                    ->updateOrInsert(
                        ['product_id' => $line->product_id, 'warehouse_id' => $order->warehouse_id],
                        ['reserved_quantity' => DB::raw("reserved_quantity + {$line->qty}"), 'updated_at' => now()]
                    );
            }

            $order->update([
                'status'       => 'confirmed',
                'confirmed_at' => now(),
            ]);
        });

        return redirect()->route('sales.show', $order)
            ->with('success', "Pedido {$order->reference} confirmado y stock reservado.");
    }

    // -------------------------------------------------------------------------
    // Workflow: Confirmed → Shipped
    // -------------------------------------------------------------------------

    public function ship(Request $request, SalesOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isConfirmed(), 403, 'La orden debe estar confirmada para registrar el despacho.');

        $order->load(['lines.product.uom', 'customer', 'warehouse']);

        return Inertia::render('Sales::Orders/Ship', [
            'order' => $order,
        ]);
    }

    public function storeShip(Request $request, SalesOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isConfirmed(), 403, 'La orden debe estar confirmada para registrar el despacho.');

        $data = $request->validate([
            'shipped_at'  => ['required', 'date'],
            'notes'       => ['nullable', 'string', 'max:2000'],
            'lines'       => ['required', 'array', 'min:1'],
            'lines.*.line_id'    => ['required', 'exists:sales_order_lines,id'],
            'lines.*.qty_shipped' => ['required', 'numeric', 'min:0'],
        ]);

        DB::transaction(function () use ($order, $data) {
            $order->load('lines.product');

            $shippedMap = collect($data['lines'])->keyBy('line_id');

            // Create StockMove (type: out) — stock leaves the warehouse
            $move = StockMove::create([
                'type'               => 'out',
                'warehouse_id'       => $order->warehouse_id,
                'reference'          => $order->reference,
                'notes'              => $data['notes'] ?? "Despacho de {$order->reference}",
                'moved_at'           => $data['shipped_at'],
                'created_by'         => Auth::id(),
                'accounting_pending' => true,
            ]);

            foreach ($order->lines as $line) {
                $entry      = $shippedMap->get($line->id);
                $qtyShipped = $entry ? (float) $entry['qty_shipped'] : 0;

                $line->qty_shipped = $qtyShipped;
                $line->save();

                if ($qtyShipped > 0) {
                    StockMoveLine::create([
                        'stock_move_id' => $move->id,
                        'product_id'    => $line->product_id,
                        'lot_id'        => null,
                        'qty'           => $qtyShipped,
                        'unit_cost'     => $line->product->cost ?? 0,
                    ]);
                }
            }

            // Process the stock movement (decrements stock_quantities)
            $move->load('lines.product');
            $move->process();

            $order->update([
                'status'        => 'shipped',
                'shipped_at'    => $data['shipped_at'],
                'stock_move_id' => $move->id,
            ]);
        });

        return redirect()->route('sales.show', $order)
            ->with('success', "Despacho registrado. El stock ha sido decrementado automáticamente.");
    }

    // -------------------------------------------------------------------------
    // Workflow: Shipped → Invoiced
    // -------------------------------------------------------------------------

    public function invoice(Request $request, SalesOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isShipped(), 403, 'La orden debe estar despachada para emitir la factura.');

        $order->load(['lines.product', 'customer', 'currency']);

        return Inertia::render('Sales::Orders/Invoice', [
            'order' => $order,
        ]);
    }

    public function storeInvoice(Request $request, SalesOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(! $order->isShipped(), 403, 'La orden debe estar despachada para emitir la factura.');

        $data = $request->validate([
            'invoice_number'   => ['required', 'string', 'max:100'],
            'invoice_date'     => ['required', 'date'],
            'invoice_due_date' => ['nullable', 'date', 'after_or_equal:invoice_date'],
            'notes'            => ['nullable', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($order, $data) {
            $order->load(['lines.product']);

            // 1. Create StockMove (OUT)
            $move = StockMove::create([
                'type'               => 'out',
                'warehouse_id'       => $order->warehouse_id,
                'reference'          => $order->reference,
                'notes'              => $data['notes'] ?? "Facturación automática de {$order->reference}",
                'moved_at'           => $data['invoice_date'],
                'created_by'         => Auth::id(),
                'accounting_pending' => true,
            ]);

            foreach ($order->lines as $line) {
                // Add to move
                StockMoveLine::create([
                    'stock_move_id' => $move->id,
                    'product_id'    => $line->product_id,
                    'qty'           => $line->qty,
                    'unit_cost'     => $line->product->cost ?? 0,
                ]);

                // Cleanup reservation: decrement reserved_quantity
                // Note: StockMove::process() will decrement 'quantity' physically.
                DB::table('stock_quantities')
                    ->where('product_id', $line->product_id)
                    ->where('warehouse_id', $order->warehouse_id)
                    ->update([
                        'reserved_quantity' => DB::raw("GREATEST(0, reserved_quantity - {$line->qty})"),
                        'updated_at'        => now(),
                    ]);
            }

            // 2. Process the stock movement
            $move->process();

            // 3. Update Order
            $order->update([
                'status'           => 'invoiced',
                'invoiced_at'      => now(),
                'invoice_number'   => $data['invoice_number'],
                'invoice_date'     => $data['invoice_date'],
                'invoice_due_date' => $data['invoice_due_date'] ?? null,
                'notes'            => $data['notes'] ?? $order->notes,
                'stock_move_id'    => $move->id,
            ]);
        });

        return redirect()->route('sales.show', $order)
            ->with('success', "Factura {$data['invoice_number']} emitida. Orden {$order->reference} completamente procesada.");
    }
}
