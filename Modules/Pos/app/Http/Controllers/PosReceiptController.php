<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Pos\Models\PosSale;
use Modules\Pos\Models\ReceiptPrint;
use Modules\Pos\Models\KitchenTicket;

class PosReceiptController extends Controller
{
    public function show(PosSale $sale): Response
    {
        return Inertia::render('Pos::Receipt/Show', [
            'sale' => [
                'id' => $sale->id,
                'reference' => $sale->reference,
                'status' => $sale->status,
                'subtotal' => (float) $sale->subtotal,
                'discount_amount' => (float) $sale->discount_amount,
                'tax_amount' => (float) $sale->tax_amount,
                'total' => (float) $sale->total,
                'payment_method' => $sale->payment_method,
                'created_at' => $sale->created_at->format('Y-m-d H:i:s'),
                'table_number' => $sale->table?->number,
                'waiter_name' => $sale->waiter?->name,
                'session_reference' => $sale->session?->reference,
                'lines' => $sale->lines->map(fn ($line) => [
                    'product_name' => $line->product?->name,
                    'qty' => (float) $line->qty,
                    'unit_price' => (float) $line->unit_price,
                    'total' => (float) $line->total,
                ]),
            ],
            'prints' => $this->getReceiptPrints($sale),
        ]);
    }

    public function receipt(PosSale $sale): Response
    {
        // Track print
        ReceiptPrint::create([
            'pos_sale_id' => $sale->id,
            'printer_type' => 'receipt',
            'printed_by' => auth()->id(),
            'printed_at' => now(),
        ]);

        return Inertia::render('Pos::Receipt/Print', [
            'sale' => [
                'reference' => $sale->reference,
                'created_at' => $sale->created_at->format('Y-m-d H:i:s'),
                'subtotal' => (float) $sale->subtotal,
                'discount_amount' => (float) $sale->discount_amount,
                'tax_amount' => (float) $sale->tax_amount,
                'total' => (float) $sale->total,
                'payment_method' => $sale->payment_method,
                'waiter_name' => $sale->waiter?->name,
                'table_number' => $sale->table?->number,
                'lines' => $sale->lines->map(fn ($line) => [
                    'product_name' => $line->product?->name,
                    'qty' => (float) $line->qty,
                    'unit_price' => (float) $line->unit_price,
                    'total' => (float) $line->total,
                ]),
            ],
        ]);
    }

    public function reprint(PosSale $sale): RedirectResponse
    {
        $print = ReceiptPrint::where('pos_sale_id', $sale->id)
            ->where('printer_type', 'receipt')
            ->first();

        if ($print) {
            $print->incrementReprint();
        } else {
            ReceiptPrint::create([
                'pos_sale_id' => $sale->id,
                'printer_type' => 'receipt',
                'printed_by' => auth()->id(),
                'printed_at' => now(),
                'reprint_count' => 1,
            ]);
        }

        return redirect()->route('pos.receipt.show', $sale)
            ->with('success', 'Recibo reimpreso.');
    }

    public function kitchenTicket(PosSale $sale): Response
    {
        $order = $sale->order;

        if (!$order) {
            abort(404, 'No hay comanda asociada a esta venta');
        }

        $ticket = KitchenTicket::where('pos_order_id', $order->id)->first();

        if (!$ticket) {
            abort(404, 'No hay ticket de cocina para esta orden');
        }

        // Track print
        ReceiptPrint::create([
            'pos_sale_id' => $sale->id,
            'printer_type' => 'kitchen',
            'printed_by' => auth()->id(),
            'printed_at' => now(),
        ]);

        return Inertia::render('Pos::Receipt/KitchenTicketPrint', [
            'ticket' => [
                'reference' => $order->reference,
                'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                'special_notes' => $order->special_notes ?? $ticket->special_notes,
                'items' => $ticket->items->map(fn ($item) => [
                    'product_name' => $item->product?->name,
                    'qty' => (float) $item->qty,
                    'special_instructions' => $item->special_instructions,
                ]),
            ],
        ]);
    }

    public function reprints(PosSale $sale): Response
    {
        $reprints = ReceiptPrint::where('pos_sale_id', $sale->id)
            ->with('printedByUser')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ReceiptPrint $p) => [
                'id' => $p->id,
                'printer_type' => $p->printer_type,
                'printer_name' => $p->printer_name,
                'printed_at' => $p->printed_at->format('Y-m-d H:i:s'),
                'reprint_count' => $p->reprint_count,
                'printed_by' => $p->printedByUser?->name,
            ]);

        return Inertia::render('Pos::Receipt/Reprints', [
            'sale_reference' => $sale->reference,
            'reprints' => $reprints,
        ]);
    }

    private function getReceiptPrints(PosSale $sale): array
    {
        return ReceiptPrint::where('pos_sale_id', $sale->id)
            ->with('printedByUser')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ReceiptPrint $p) => [
                'id' => $p->id,
                'printer_type' => $p->printer_type,
                'printer_name' => $p->printer_name,
                'printed_at' => $p->printed_at->format('Y-m-d H:i:s'),
                'reprint_count' => $p->reprint_count,
                'printed_by' => $p->printedByUser?->name,
            ])
            ->toArray();
    }
}
