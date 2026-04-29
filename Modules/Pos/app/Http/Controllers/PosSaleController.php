<?php

namespace Modules\Pos\Http\Controllers;

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
use Modules\Pos\Models\PosSession;
use Modules\Pos\Models\PosSale;
use Modules\Pos\Models\PosSaleLine;

class PosSaleController extends Controller
{
    // -------------------------------------------------------------------------
    // Terminal — POS sell screen
    // -------------------------------------------------------------------------

    public function sell(Request $request, PosSession $session): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if($session->isClosed(), 403, 'Esta sesión está cerrada. Abre una nueva sesión para vender.');

        $session->load(['warehouse', 'currency']);

        $products = Product::where('active', true)
            ->whereIn('type', ['storable', 'service', 'consumable'])
            ->with(['uom:id,abbreviation', 'category:id,name,image_path', 'taxRate:id,rate'])
            ->orderBy('name')
            ->get(['id', 'sku', 'name', 'price', 'type', 'uom_id', 'category_id', 'tax_rate_id', 'image_path']);

        // Batch-load stock quantities for all storable products in a single query
        $storableIds = $products->where('type', 'storable')->pluck('id')->all();
        $stockMap    = [];
        if ($storableIds) {
            $stockMap = DB::table('stock_quantities')
                ->where('warehouse_id', $session->warehouse_id)
                ->whereIn('product_id', $storableIds)
                ->get(['product_id', 'quantity', 'reserved_quantity'])
                ->keyBy('product_id')
                ->map(fn ($r) => max(0, (float) $r->quantity - (float) $r->reserved_quantity))
                ->all();
        }

        $products = $products->map(function ($product) use ($stockMap) {
            $stock = $product->type === 'storable'
                ? ($stockMap[$product->id] ?? 0.0)
                : null;
            return array_merge($product->toArray(), ['stock' => $stock]);
        });

        $customers = Contact::where('is_client', true)
            ->where('active', true)
            ->orderBy('name')
            ->get(['id', 'name']);

        // Last 5 sales for quick reference
        $recentSales = $session->sales()
            ->with(['lines', 'customer'])
            ->where('status', 'completed')
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        return Inertia::render('Pos::Terminal/Sell', [
            'session'     => $session,
            'products'    => $products,
            'customers'   => $customers,
            'recentSales' => $recentSales,
        ]);
    }

    // -------------------------------------------------------------------------
    // Store — process a sale
    // -------------------------------------------------------------------------

    public function store(Request $request, PosSession $session): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if($session->isClosed(), 403, 'Esta sesión está cerrada.');

        $data = $request->validate([
            'customer_id'     => ['nullable', 'exists:contacts,id'],
            'payment_method'  => ['required', 'in:cash,card,transfer'],
            'amount_tendered' => ['required', 'numeric', 'min:0'],
            'notes'           => ['nullable', 'string', 'max:500'],
            'lines'           => ['required', 'array', 'min:1'],
            'lines.*.product_id'  => ['required', 'exists:products,id'],
            'lines.*.qty'         => ['required', 'numeric', 'min:0.01'],
            'lines.*.unit_price'  => ['required', 'numeric', 'min:0'],
            'lines.*.tax_rate'    => ['required', 'numeric', 'min:0', 'max:100'],
            'lines.*.description' => ['nullable', 'string', 'max:500'],
        ]);

        // For cash payments the tendered amount must cover the total
        if ($data['payment_method'] === 'cash') {
            $lineTotal = collect($data['lines'])->sum(function ($l) {
                $sub = (float) $l['qty'] * (float) $l['unit_price'];
                return round($sub + $sub * ((float) $l['tax_rate'] / 100), 4);
            });

            if ((float) $data['amount_tendered'] < $lineTotal) {
                return back()->withErrors(['amount_tendered' => 'El monto recibido no cubre el total de la venta.'])->withInput();
            }
        }

        $sale = DB::transaction(function () use ($session, $data) {
            // Pre-load all products in a single query to avoid N+1
            $productIds = collect($data['lines'])->pluck('product_id')->unique()->all();
            $products   = Product::whereIn('id', $productIds)->get()->keyBy('id');

            // 1. Calculate totals
            $subtotal  = 0;
            $taxAmount = 0;

            foreach ($data['lines'] as $l) {
                $sub        = (float) $l['qty'] * (float) $l['unit_price'];
                $tax        = $sub * ((float) $l['tax_rate'] / 100);
                $subtotal  += $sub;
                $taxAmount += $tax;
            }

            $total       = round($subtotal + $taxAmount, 4);
            $subtotal    = round($subtotal, 4);
            $taxAmount   = round($taxAmount, 4);
            $tendered    = (float) $data['amount_tendered'];
            $changeGiven = max(0, $tendered - $total);

            // 2. Create the PosSale
            $sale = PosSale::create([
                'reference'       => PosSale::generateReference(),
                'pos_session_id'  => $session->id,
                'customer_id'     => $data['customer_id'] ?? null,
                'currency_id'     => $session->currency_id,
                'status'          => 'completed',
                'payment_method'  => $data['payment_method'],
                'amount_tendered' => $tendered,
                'change_given'    => $changeGiven,
                'subtotal'        => $subtotal,
                'tax_amount'      => $taxAmount,
                'total'           => $total,
                'notes'           => $data['notes'] ?? null,
                'created_by'      => Auth::id(),
            ]);

            // 3. Create sale lines
            foreach ($data['lines'] as $l) {
                $line = new PosSaleLine([
                    'pos_sale_id' => $sale->id,
                    'product_id'  => $l['product_id'],
                    'qty'         => $l['qty'],
                    'unit_price'  => $l['unit_price'],
                    'tax_rate'    => $l['tax_rate'],
                    'description' => $l['description'] ?? null,
                ]);
                $line->recalculateTotals();
                $line->save();
            }

            // 4. Create stock move (out) and process it
            $storableLines = collect($data['lines'])->filter(
                fn ($l) => isset($products[$l['product_id']]) && $products[$l['product_id']]->type === 'storable'
            );

            if ($storableLines->isNotEmpty()) {
                $move = StockMove::create([
                    'type'               => 'out',
                    'warehouse_id'       => $session->warehouse_id,
                    'reference'          => $sale->reference,
                    'notes'              => "Venta POS {$sale->reference}",
                    'moved_at'           => now(),
                    'created_by'         => Auth::id(),
                    'accounting_pending' => true,
                ]);

                foreach ($storableLines as $l) {
                    $product = $products[$l['product_id']];
                    StockMoveLine::create([
                        'stock_move_id' => $move->id,
                        'product_id'    => $l['product_id'],
                        'lot_id'        => null,
                        'qty'           => $l['qty'],
                        'unit_cost'     => $product->cost ?? 0,
                    ]);
                }

                $move->load('lines.product');
                $move->process();

                $sale->update(['stock_move_id' => $move->id]);
            }

            // 5. Update session running totals
            $session->recalculateTotals();

            return $sale;
        });

        return redirect()->route('pos.sales.receipt', $sale)
            ->with('success', "Venta {$sale->reference} registrada correctamente.");
    }

    // -------------------------------------------------------------------------
    // Receipt — view after sale
    // -------------------------------------------------------------------------

    public function receipt(Request $request, PosSale $sale): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $sale->load([
            'session.warehouse',
            'session.currency',
            'customer',
            'lines.product.uom',
            'creator',
        ]);

        return Inertia::render('Pos::Sales/Receipt', [
            'sale' => $sale,
        ]);
    }

    // -------------------------------------------------------------------------
    // Void — cancel a completed sale
    // -------------------------------------------------------------------------

    public function void(Request $request, PosSale $sale): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $sale->loadMissing(['session', 'lines.product']);

        abort_if($sale->isVoided(), 403, 'Esta venta ya está anulada.');
        abort_if($sale->session->isClosed(), 403, 'No se puede anular una venta de una sesión cerrada.');

        DB::transaction(function () use ($sale) {
            // Return stock: create an "in" move
            if ($sale->stock_move_id) {
                $returnMove = StockMove::create([
                    'type'               => 'in',
                    'warehouse_id'       => $sale->session->warehouse_id,
                    'reference'          => $sale->reference . '-VOID',
                    'notes'              => "Anulación de venta {$sale->reference}",
                    'moved_at'           => now(),
                    'created_by'         => Auth::id(),
                    'accounting_pending' => true,
                ]);

                foreach ($sale->lines as $line) {
                    if ($line->product && $line->product->type === 'storable') {
                        StockMoveLine::create([
                            'stock_move_id' => $returnMove->id,
                            'product_id'    => $line->product_id,
                            'lot_id'        => null,
                            'qty'           => $line->qty,
                            'unit_cost'     => $line->product->cost ?? 0,
                        ]);
                    }
                }

                $returnMove->load('lines.product');
                $returnMove->process();
            }

            $sale->update([
                'status'    => 'voided',
                'voided_at' => now(),
                'voided_by' => Auth::id(),
            ]);

            $sale->session->recalculateTotals();
        });

        return redirect()->route('pos.sell', $sale->pos_session_id)
            ->with('success', "Venta {$sale->reference} anulada. El stock fue restituido.");
    }
}
