<?php

namespace Modules\Rentals\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\Product;
use Modules\Rentals\Models\RentalOrder;
use Modules\Rentals\Models\RentalOrderLine;

class RentalReportController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $from = $request->input('from', now()->startOfYear()->toDateString());
        $to   = $request->input('to',   now()->toDateString());

        // ── Utilization per product ──────────────────────────────────────────
        $utilization = RentalOrderLine::join('rental_orders', 'rental_orders.id', '=', 'rental_order_lines.rental_order_id')
            ->join('products', 'products.id', '=', 'rental_order_lines.product_id')
            ->whereIn('rental_orders.status', ['active', 'returned', 'invoiced', 'closed'])
            ->whereBetween('rental_orders.start_date', [$from, $to])
            ->select(
                'rental_order_lines.product_id',
                DB::raw('products.name as product_name'),
                DB::raw('products.sku as product_sku'),
                DB::raw('COUNT(DISTINCT rental_orders.id) as times_rented'),
                DB::raw('SUM(rental_orders.end_date - rental_orders.start_date) as total_days_rented'),
                DB::raw('SUM(rental_order_lines.total) as total_revenue')
            )
            ->groupBy('rental_order_lines.product_id', 'products.name', 'products.sku')
            ->orderByDesc('total_revenue')
            ->get();

        $periodDays = max(1, now()->parse($from)->diffInDays(now()->parse($to)));

        $utilization = $utilization->map(function ($row) use ($periodDays) {
            $row->utilization_pct = round(min(100, ($row->total_days_rented / $periodDays) * 100), 1);
            return $row;
        });

        // ── ROI per product ──────────────────────────────────────────────────
        $roi = Product::whereHas('rentalRate')
            ->with('rentalRate')
            ->whereIn('id', RentalOrderLine::pluck('product_id')->unique())
            ->get(['id', 'sku', 'name', 'cost'])
            ->map(function ($product) use ($utilization) {
                $stats         = $utilization->firstWhere('product_id', $product->id);
                $totalRevenue  = $stats ? (float) $stats->total_revenue : 0;
                $productCost   = (float) $product->cost;
                $roiPct        = $productCost > 0 ? round((($totalRevenue - $productCost) / $productCost) * 100, 1) : null;

                return [
                    'product_id'    => $product->id,
                    'product_name'  => $product->name,
                    'product_sku'   => $product->sku,
                    'product_cost'  => $productCost,
                    'total_revenue' => $totalRevenue,
                    'roi_pct'       => $roiPct,
                ];
            })->sortByDesc('roi_pct')->values();

        // ── Customer reliability ─────────────────────────────────────────────
        $customerStats = RentalOrder::whereIn('status', ['returned', 'invoiced', 'closed'])
            ->whereBetween('start_date', [$from, $to])
            ->join('contacts', 'contacts.id', '=', 'rental_orders.customer_id')
            ->select(
                'rental_orders.customer_id',
                DB::raw('contacts.name as customer_name'),
                DB::raw('COUNT(*) as total_rentals'),
                DB::raw('SUM(rental_orders.damage_charges) as total_damage_charges'),
                DB::raw('SUM(rental_orders.total) as total_spent'),
                DB::raw('AVG(EXTRACT(EPOCH FROM (rental_orders.returned_at - rental_orders.end_date::timestamp))/86400) as avg_delay_days')
            )
            ->groupBy('rental_orders.customer_id', 'contacts.name')
            ->orderByDesc('total_spent')
            ->get();

        // ── Summary KPIs ─────────────────────────────────────────────────────
        $summary = RentalOrder::whereIn('status', ['active', 'returned', 'invoiced', 'closed'])
            ->whereBetween('start_date', [$from, $to])
            ->selectRaw('COUNT(*) as total_orders, SUM(total) as gross_revenue, SUM(damage_charges) as total_damages, AVG(end_date - start_date) as avg_rental_days')
            ->first();

        return Inertia::render('Rentals::Reports/Index', [
            'utilization'   => $utilization,
            'roi'           => $roi,
            'customerStats' => $customerStats,
            'summary'       => $summary,
            'filters'       => compact('from', 'to'),
        ]);
    }
}
