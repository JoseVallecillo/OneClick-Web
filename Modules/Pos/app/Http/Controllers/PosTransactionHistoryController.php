<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Pos\Models\PosSale;
use Modules\Pos\Models\PosOrder;

class PosTransactionHistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $query = PosSale::query();

        // Date range filter
        if ($request->has('from') && $request->input('from')) {
            $from = Carbon::createFromFormat('Y-m-d', $request->input('from'))->startOfDay();
            $query->where('created_at', '>=', $from);
        }

        if ($request->has('to') && $request->input('to')) {
            $to = Carbon::createFromFormat('Y-m-d', $request->input('to'))->endOfDay();
            $query->where('created_at', '<=', $to);
        }

        // Status filter
        if ($request->has('status') && $request->input('status')) {
            $query->where('status', $request->input('status'));
        }

        // Amount range filter
        if ($request->has('min_amount') && $request->input('min_amount')) {
            $query->where('total', '>=', (float) $request->input('min_amount'));
        }

        if ($request->has('max_amount') && $request->input('max_amount')) {
            $query->where('total', '<=', (float) $request->input('max_amount'));
        }

        // Search by reference
        if ($request->has('search') && $request->input('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where('reference', 'like', $search);
        }

        $transactions = $query
            ->with(['session', 'table', 'waiter'])
            ->orderByDesc('created_at')
            ->paginate(20)
            ->through(fn (PosSale $s) => [
                'id' => $s->id,
                'reference' => $s->reference,
                'type' => $s->pos_order_id ? 'order' : 'sale',
                'status' => $s->status,
                'total' => (float) $s->total,
                'discount_amount' => (float) $s->discount_amount,
                'tax_amount' => (float) $s->tax_amount,
                'created_at' => $s->created_at->format('Y-m-d H:i:s'),
                'table_number' => $s->table?->number,
                'waiter_name' => $s->waiter?->name,
                'payment_method' => $s->payment_method,
                'void_reason' => $s->void_reason,
            ]);

        return Inertia::render('Pos::TransactionHistory/Index', [
            'transactions' => $transactions,
            'filters' => [
                'from' => $request->input('from'),
                'to' => $request->input('to'),
                'status' => $request->input('status'),
                'min_amount' => $request->input('min_amount'),
                'max_amount' => $request->input('max_amount'),
                'search' => $request->input('search'),
            ],
            'statuses' => [
                'completed' => 'Completadas',
                'pending' => 'Pendientes',
                'void' => 'Anuladas',
                'cancelled' => 'Canceladas',
            ],
        ]);
    }

    public function show(PosSale $sale): Response
    {
        return Inertia::render('Pos::TransactionHistory/Show', [
            'sale' => [
                'id' => $sale->id,
                'reference' => $sale->reference,
                'status' => $sale->status,
                'total' => (float) $sale->total,
                'subtotal' => (float) $sale->subtotal,
                'discount_amount' => (float) $sale->discount_amount,
                'tax_amount' => (float) $sale->tax_amount,
                'payment_method' => $sale->payment_method,
                'created_at' => $sale->created_at->format('Y-m-d H:i:s'),
                'table_number' => $sale->table?->number,
                'waiter_name' => $sale->waiter?->name,
                'session_reference' => $sale->session?->reference,
                'void_reason' => $sale->void_reason,
                'voided_at' => $sale->updated_at->format('Y-m-d H:i:s'),
                'lines' => $sale->lines->map(fn ($line) => [
                    'product_name' => $line->product?->name,
                    'qty' => (float) $line->qty,
                    'unit_price' => (float) $line->unit_price,
                    'total' => (float) $line->total,
                ]),
            ],
        ]);
    }

    public function export(Request $request)
    {
        $query = PosSale::query();

        if ($request->has('from') && $request->input('from')) {
            $from = Carbon::createFromFormat('Y-m-d', $request->input('from'))->startOfDay();
            $query->where('created_at', '>=', $from);
        }

        if ($request->has('to') && $request->input('to')) {
            $to = Carbon::createFromFormat('Y-m-d', $request->input('to'))->endOfDay();
            $query->where('created_at', '<=', $to);
        }

        if ($request->has('status') && $request->input('status')) {
            $query->where('status', $request->input('status'));
        }

        $transactions = $query->with(['session', 'table', 'waiter'])->get();

        $csv = "Referencia,Tipo,Estado,Total,Descuento,Impuesto,Fecha,Mesa,Mesero,Método Pago,Razón Anulación\n";

        foreach ($transactions as $sale) {
            $csv .= implode(',', [
                $sale->reference,
                $sale->pos_order_id ? 'Orden' : 'Venta',
                $sale->status,
                $sale->total,
                $sale->discount_amount,
                $sale->tax_amount,
                $sale->created_at->format('Y-m-d H:i:s'),
                $sale->table?->number ?? '',
                $sale->waiter?->name ?? '',
                $sale->payment_method ?? '',
                $sale->void_reason ?? '',
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="pos-history-' . now()->format('Y-m-d') . '.csv"',
        ]);
    }
}
