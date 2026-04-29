<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Pos\Models\PosSale;
use Modules\Pos\Models\PosOrder;
use Modules\Pos\Models\PosSession;
use Modules\Pos\Models\PosWaiter;

class PosReportController extends Controller
{
    public function salesByPeriod(Request $request): Response
    {
        $from = $request->input('from')
            ? Carbon::createFromFormat('Y-m-d', $request->input('from'))->startOfDay()
            : now()->subDays(30)->startOfDay();

        $to = $request->input('to')
            ? Carbon::createFromFormat('Y-m-d', $request->input('to'))->endOfDay()
            : now()->endOfDay();

        $sales = PosSale::whereBetween('created_at', [$from, $to])
            ->with('session')
            ->get()
            ->groupBy(fn ($sale) => $sale->created_at->format('Y-m-d'))
            ->map(fn ($daySales) => [
                'date' => $daySales->first()->created_at->format('Y-m-d'),
                'total_sales' => $daySales->count(),
                'total_amount' => (float) $daySales->sum('total'),
                'total_discount' => (float) $daySales->sum('discount_amount'),
                'total_tax' => (float) $daySales->sum('tax_amount'),
            ])
            ->values();

        $totalSales = PosSale::whereBetween('created_at', [$from, $to])->count();
        $totalAmount = PosSale::whereBetween('created_at', [$from, $to])->sum('total');
        $avgTicket = $totalSales > 0 ? $totalAmount / $totalSales : 0;

        return Inertia::render('Pos::Reports/SalesByPeriod', [
            'sales' => $sales,
            'summary' => [
                'total_sales' => $totalSales,
                'total_amount' => (float) $totalAmount,
                'avg_ticket' => (float) $avgTicket,
            ],
            'filters' => [
                'from' => $from->format('Y-m-d'),
                'to' => $to->format('Y-m-d'),
            ],
        ]);
    }

    public function salesByWaiter(Request $request): Response
    {
        $from = $request->input('from')
            ? Carbon::createFromFormat('Y-m-d', $request->input('from'))->startOfDay()
            : now()->subDays(30)->startOfDay();

        $to = $request->input('to')
            ? Carbon::createFromFormat('Y-m-d', $request->input('to'))->endOfDay()
            : now()->endOfDay();

        $waiters = PosWaiter::with(['orders' => function ($q) use ($from, $to) {
            $q->whereBetween('created_at', [$from, $to]);
        }])
        ->get()
        ->map(fn (PosWaiter $w) => [
            'id' => $w->id,
            'name' => $w->name,
            'code' => $w->code,
            'total_orders' => $w->orders->count(),
            'total_amount' => (float) $w->orders->sum('total'),
            'avg_order' => $w->orders->count() > 0
                ? (float) ($w->orders->sum('total') / $w->orders->count())
                : 0,
        ])
        ->sortByDesc('total_amount')
        ->values();

        return Inertia::render('Pos::Reports/SalesByWaiter', [
            'waiters' => $waiters,
            'filters' => [
                'from' => $from->format('Y-m-d'),
                'to' => $to->format('Y-m-d'),
            ],
        ]);
    }

    public function salesByTable(Request $request): Response
    {
        $from = $request->input('from')
            ? Carbon::createFromFormat('Y-m-d', $request->input('from'))->startOfDay()
            : now()->subDays(30)->startOfDay();

        $to = $request->input('to')
            ? Carbon::createFromFormat('Y-m-d', $request->input('to'))->endOfDay()
            : now()->endOfDay();

        $tables = PosOrder::whereBetween('created_at', [$from, $to])
            ->with('table')
            ->get()
            ->groupBy('pos_table_id')
            ->map(fn ($tableOrders) => [
                'table_number' => $tableOrders->first()->table?->number,
                'table_section' => $tableOrders->first()->table?->section,
                'total_orders' => $tableOrders->count(),
                'total_amount' => (float) $tableOrders->sum('total'),
                'avg_order' => $tableOrders->count() > 0
                    ? (float) ($tableOrders->sum('total') / $tableOrders->count())
                    : 0,
            ])
            ->sortByDesc('total_amount')
            ->values();

        return Inertia::render('Pos::Reports/SalesByTable', [
            'tables' => $tables,
            'filters' => [
                'from' => $from->format('Y-m-d'),
                'to' => $to->format('Y-m-d'),
            ],
        ]);
    }

    public function productAnalysis(Request $request): Response
    {
        $from = $request->input('from')
            ? Carbon::createFromFormat('Y-m-d', $request->input('from'))->startOfDay()
            : now()->subDays(30)->startOfDay();

        $to = $request->input('to')
            ? Carbon::createFromFormat('Y-m-d', $request->input('to'))->endOfDay()
            : now()->endOfDay();

        $products = \DB::table('pos_sale_lines')
            ->join('products', 'pos_sale_lines.product_id', '=', 'products.id')
            ->join('pos_sales', 'pos_sale_lines.pos_sale_id', '=', 'pos_sales.id')
            ->whereBetween('pos_sales.created_at', [$from, $to])
            ->groupBy('pos_sale_lines.product_id', 'products.name')
            ->select('pos_sale_lines.product_id', 'products.name')
            ->selectRaw('COUNT(*) as qty_sold')
            ->selectRaw('SUM(pos_sale_lines.qty) as units_sold')
            ->selectRaw('SUM(pos_sale_lines.total) as total_amount')
            ->orderByDesc('total_amount')
            ->get()
            ->map(fn ($p) => [
                'product_id' => $p->product_id,
                'name' => $p->name,
                'qty_sold' => (int) $p->qty_sold,
                'units_sold' => (float) $p->units_sold,
                'total_amount' => (float) $p->total_amount,
            ]);

        return Inertia::render('Pos::Reports/ProductAnalysis', [
            'products' => $products,
            'filters' => [
                'from' => $from->format('Y-m-d'),
                'to' => $to->format('Y-m-d'),
            ],
        ]);
    }

    public function voidReport(Request $request): Response
    {
        $from = $request->input('from')
            ? Carbon::createFromFormat('Y-m-d', $request->input('from'))->startOfDay()
            : now()->subDays(30)->startOfDay();

        $to = $request->input('to')
            ? Carbon::createFromFormat('Y-m-d', $request->input('to'))->endOfDay()
            : now()->endOfDay();

        $voids = PosSale::where('status', 'void')
            ->whereBetween('created_at', [$from, $to])
            ->with('session')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (PosSale $s) => [
                'id' => $s->id,
                'reference' => $s->reference,
                'total' => (float) $s->total,
                'void_reason' => $s->void_reason,
                'voided_by' => $s->voided_by,
                'voided_at' => $s->updated_at->format('Y-m-d H:i:s'),
                'session_reference' => $s->session?->reference,
            ]);

        $totalVoided = PosSale::where('status', 'void')
            ->whereBetween('created_at', [$from, $to])
            ->sum('total');

        return Inertia::render('Pos::Reports/VoidReport', [
            'voids' => $voids,
            'summary' => [
                'total_void_count' => $voids->count(),
                'total_void_amount' => (float) $totalVoided,
            ],
            'filters' => [
                'from' => $from->format('Y-m-d'),
                'to' => $to->format('Y-m-d'),
            ],
        ]);
    }

    public function sessionReport(Request $request): Response
    {
        $from = $request->input('from')
            ? Carbon::createFromFormat('Y-m-d', $request->input('from'))->startOfDay()
            : now()->subDays(30)->startOfDay();

        $to = $request->input('to')
            ? Carbon::createFromFormat('Y-m-d', $request->input('to'))->endOfDay()
            : now()->endOfDay();

        $sessions = PosSession::whereBetween('created_at', [$from, $to])
            ->with(['sales', 'orders'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (PosSession $s) => [
                'id' => $s->id,
                'reference' => $s->reference,
                'status' => $s->status,
                'opened_at' => $s->opened_at->format('Y-m-d H:i:s'),
                'closed_at' => $s->closed_at?->format('Y-m-d H:i:s'),
                'total_sales' => $s->sales->count(),
                'total_amount' => (float) $s->sales->sum('total'),
                'expected_cash' => (float) ($s->expected_cash ?? 0),
                'actual_cash' => (float) ($s->actual_cash_counted ?? 0),
                'cash_difference' => (float) (($s->actual_cash_counted ?? 0) - ($s->expected_cash ?? 0)),
            ]);

        return Inertia::render('Pos::Reports/SessionReport', [
            'sessions' => $sessions,
            'filters' => [
                'from' => $from->format('Y-m-d'),
                'to' => $to->format('Y-m-d'),
            ],
        ]);
    }
}
