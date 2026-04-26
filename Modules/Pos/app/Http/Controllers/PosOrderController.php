<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\Product;
use Modules\Inventory\Models\StockMove;
use Modules\Inventory\Models\StockMoveLine;
use Modules\Pos\Models\PosOrder;
use Modules\Pos\Models\PosOrderLine;
use Modules\Pos\Models\PosSale;
use Modules\Pos\Models\PosSaleLine;
use Modules\Pos\Models\PosTable;
use Modules\Pos\Models\PosWaiter;

class PosOrderController extends Controller
{
    // -------------------------------------------------------------------------
    // Show — order management terminal for a table
    // -------------------------------------------------------------------------

    public function show(Request $request, PosOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(!$order->isOpen(), 403, 'Esta orden ya no está activa.');

        $order->load(['lines.product.uom', 'waiter', 'table', 'session.currency']);

        $products = Product::where('active', true)
            ->whereIn('type', ['storable', 'service', 'consumable'])
            ->with(['uom:id,abbreviation', 'category:id,name,image_path', 'taxRate:id,rate'])
            ->orderBy('name')
            ->get(['id', 'sku', 'name', 'price', 'type', 'uom_id', 'category_id', 'tax_rate_id', 'image_path']);

        $storableIds = $products->where('type', 'storable')->pluck('id')->all();
        $stockMap    = [];
        if ($storableIds) {
            $stockMap = DB::table('stock_quantities')
                ->where('warehouse_id', $order->session->warehouse_id)
                ->whereIn('product_id', $storableIds)
                ->get(['product_id', 'quantity', 'reserved_quantity'])
                ->keyBy('product_id')
                ->map(fn ($r) => max(0, (float) $r->quantity - (float) $r->reserved_quantity))
                ->all();
        }

        $products = $products->map(function ($product) use ($stockMap) {
            $stock = $product->type === 'storable' ? ($stockMap[$product->id] ?? 0.0) : null;
            return array_merge($product->toArray(), ['stock' => $stock]);
        });

        $waiters = PosWaiter::where('active', true)->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Pos::Orders/Show', [
            'order'   => $order,
            'products' => $products,
            'waiters'  => $waiters,
        ]);
    }

    // -------------------------------------------------------------------------
    // Add line to order
    // -------------------------------------------------------------------------

    public function addLine(Request $request, PosOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(!$order->isOpen(), 403, 'Esta orden ya no está activa.');

        $data = $request->validate([
            'product_id'  => ['required', 'exists:products,id'],
            'qty'         => ['required', 'numeric', 'min:0.01'],
            'unit_price'  => ['required', 'numeric', 'min:0'],
            'tax_rate'    => ['required', 'numeric', 'min:0', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'notes'       => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($order, $data) {
            // If same product already exists, increment qty instead of duplicate
            $existing = $order->lines()->where('product_id', $data['product_id'])->first();
            if ($existing) {
                $existing->qty = (float) $existing->qty + (float) $data['qty'];
                $existing->recalculateTotals();
                $existing->save();
            } else {
                $line = new PosOrderLine([
                    'pos_order_id' => $order->id,
                    'product_id'   => $data['product_id'],
                    'qty'          => $data['qty'],
                    'unit_price'   => $data['unit_price'],
                    'tax_rate'     => $data['tax_rate'],
                    'description'  => $data['description'] ?? null,
                    'notes'        => $data['notes'] ?? null,
                ]);
                $line->recalculateTotals();
                $line->save();
            }

            $order->refresh()->recalculateTotals();
        });

        return back();
    }

    // -------------------------------------------------------------------------
    // Update line (qty / price / notes)
    // -------------------------------------------------------------------------

    public function updateLine(Request $request, PosOrder $order, PosOrderLine $line): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(!$order->isOpen(), 403, 'Esta orden ya no está activa.');
        abort_if($line->pos_order_id !== $order->id, 403);

        $data = $request->validate([
            'qty'        => ['required', 'numeric', 'min:0.01'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'tax_rate'   => ['required', 'numeric', 'min:0', 'max:100'],
            'notes'      => ['nullable', 'string', 'max:500'],
            'status'     => ['nullable', 'in:pending,served'],
        ]);

        DB::transaction(function () use ($order, $line, $data) {
            $line->fill($data);
            $line->recalculateTotals();
            $line->save();
            $order->refresh()->recalculateTotals();
        });

        return back();
    }

    // -------------------------------------------------------------------------
    // Remove line
    // -------------------------------------------------------------------------

    public function removeLine(PosOrder $order, PosOrderLine $line): RedirectResponse
    {
        abort_if(!$order->isOpen(), 403, 'Esta orden ya no está activa.');
        abort_if($line->pos_order_id !== $order->id, 403);

        DB::transaction(function () use ($order, $line) {
            $line->delete();
            $order->refresh()->recalculateTotals();
        });

        return back();
    }

    // -------------------------------------------------------------------------
    // Assign waiter
    // -------------------------------------------------------------------------

    public function assignWaiter(Request $request, PosOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(!$order->isOpen(), 403);

        $data = $request->validate([
            'pos_waiter_id' => ['nullable', 'exists:pos_waiters,id'],
        ]);

        $order->update(['pos_waiter_id' => $data['pos_waiter_id']]);

        // Also sync the table's waiter
        if ($order->pos_table_id) {
            PosTable::where('id', $order->pos_table_id)->update([
                'pos_waiter_id' => $data['pos_waiter_id'],
                'server_name'   => $data['pos_waiter_id']
                    ? PosWaiter::find($data['pos_waiter_id'])?->name
                    : null,
            ]);
        }

        return back();
    }

    // -------------------------------------------------------------------------
    // Pre-bill — printable view without finalizing
    // -------------------------------------------------------------------------

    public function preBill(Request $request, PosOrder $order): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $order->load(['lines.product.uom', 'waiter', 'table', 'session.warehouse', 'session.currency', 'creator']);

        return Inertia::render('Pos::Orders/PreBill', [
            'order' => $order,
        ]);
    }

    // -------------------------------------------------------------------------
    // Checkout — convert order to PosSale and close the table
    // -------------------------------------------------------------------------

    public function checkout(Request $request, PosOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(!$order->isOpen(), 403, 'Esta orden ya no está activa.');

        $order->loadMissing(['lines.product', 'session', 'table']);

        if ($order->lines->isEmpty()) {
            return back()->with('error', 'La orden no tiene líneas. Agrega productos antes de cobrar.');
        }

        $data = $request->validate([
            'payment_method'  => ['required', 'in:cash,card,transfer'],
            'amount_tendered' => ['required', 'numeric', 'min:0'],
            'notes'           => ['nullable', 'string', 'max:500'],
        ]);

        if ($data['payment_method'] === 'cash') {
            if ((float) $data['amount_tendered'] < (float) $order->total) {
                return back()->withErrors(['amount_tendered' => 'El monto recibido no cubre el total de la orden.']);
            }
        }

        $sale = DB::transaction(function () use ($order, $data) {
            $tendered    = (float) $data['amount_tendered'];
            $total       = (float) $order->total;
            $changeGiven = max(0, $tendered - $total);

            // Pre-load products to avoid N+1
            $productIds = $order->lines->pluck('product_id')->unique()->all();
            $products   = Product::whereIn('id', $productIds)->get()->keyBy('id');

            $sale = PosSale::create([
                'reference'       => PosSale::generateReference(),
                'pos_session_id'  => $order->pos_session_id,
                'customer_id'     => null,
                'currency_id'     => $order->session->currency_id,
                'status'          => 'completed',
                'payment_method'  => $data['payment_method'],
                'amount_tendered' => $tendered,
                'change_given'    => $changeGiven,
                'subtotal'        => $order->subtotal,
                'tax_amount'      => $order->tax_amount,
                'total'           => $total,
                'notes'           => $data['notes'] ?? $order->notes,
                'created_by'      => Auth::id(),
            ]);

            foreach ($order->lines as $line) {
                $sl = new PosSaleLine([
                    'pos_sale_id' => $sale->id,
                    'product_id'  => $line->product_id,
                    'qty'         => $line->qty,
                    'unit_price'  => $line->unit_price,
                    'tax_rate'    => $line->tax_rate,
                    'description' => $line->description,
                ]);
                $sl->recalculateTotals();
                $sl->save();
            }

            // Stock movements for storable products
            $storableLines = $order->lines->filter(
                fn ($l) => isset($products[$l->product_id]) && $products[$l->product_id]->type === 'storable'
            );

            if ($storableLines->isNotEmpty()) {
                $move = StockMove::create([
                    'type'               => 'out',
                    'warehouse_id'       => $order->session->warehouse_id,
                    'reference'          => $sale->reference,
                    'notes'              => "Venta POS (Mesa) {$sale->reference}",
                    'moved_at'           => now(),
                    'created_by'         => Auth::id(),
                    'accounting_pending' => true,
                ]);

                foreach ($storableLines as $l) {
                    $product = $products[$l->product_id];
                    StockMoveLine::create([
                        'stock_move_id' => $move->id,
                        'product_id'    => $l->product_id,
                        'lot_id'        => null,
                        'qty'           => $l->qty,
                        'unit_cost'     => $product->cost ?? 0,
                    ]);
                }

                $move->load('lines.product');
                $move->process();

                $sale->update(['stock_move_id' => $move->id]);
            }

            // Mark order as billed
            $order->update([
                'status'     => 'billed',
                'billed_at'  => now(),
                'pos_sale_id' => $sale->id,
            ]);

            // Release the table
            if ($order->table) {
                $order->table->update([
                    'status'           => 'available',
                    'server_name'      => null,
                    'opened_at'        => null,
                    'total'            => 0,
                    'pos_session_id'   => null,
                    'current_order_id' => null,
                    'pos_waiter_id'    => null,
                ]);
            }

            $order->session->recalculateTotals();

            return $sale;
        });

        return redirect()->route('pos.sales.receipt', $sale)
            ->with('success', "Orden cobrada. Venta {$sale->reference} registrada correctamente.");
    }

    // -------------------------------------------------------------------------
    // Cancel order
    // -------------------------------------------------------------------------

    public function cancel(Request $request, PosOrder $order): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if(!$order->isOpen(), 403, 'Esta orden ya no se puede cancelar.');

        DB::transaction(function () use ($order) {
            $order->update(['status' => 'cancelled']);

            if ($order->table) {
                $order->table->update([
                    'status'           => 'available',
                    'server_name'      => null,
                    'opened_at'        => null,
                    'total'            => 0,
                    'pos_session_id'   => null,
                    'current_order_id' => null,
                    'pos_waiter_id'    => null,
                ]);
            }
        });

        return redirect()->route('pos.tables.index')
            ->with('success', "Orden {$order->reference} cancelada.");
    }
}
