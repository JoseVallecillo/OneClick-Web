<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\ProductAnalytics;
use Modules\Inventory\Models\Product;
use Modules\Inventory\Models\StockQuantity;
use Modules\Inventory\Models\ReorderSuggestion;

class InventoryReportController extends Controller
{
    public function valuation(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $stocks = StockQuantity::with('product', 'warehouse')
            ->get()
            ->map(fn ($stock) => [
                'product_id' => $stock->product_id,
                'product_sku' => $stock->product->sku,
                'product_name' => $stock->product->name,
                'warehouse' => $stock->warehouse->name,
                'quantity' => (float) $stock->quantity,
                'unit_cost' => (float) $stock->product->cost,
                'total_value' => (float) $stock->quantity * (float) $stock->product->cost,
            ]);

        $totalValue = $stocks->sum('total_value');

        return Inertia::render('Inventory::Reports/Valuation', [
            'stocks' => $stocks,
            'totalValue' => $totalValue,
        ]);
    }

    public function abcAnalysis(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $analytics = ProductAnalytics::with('product')
            ->orderBy('total_sold_value', 'desc')
            ->get()
            ->map(fn ($a) => [
                'product_id' => $a->product_id,
                'product_sku' => $a->product->sku,
                'product_name' => $a->product->name,
                'total_sold_value' => (float) $a->total_sold_value,
                'abc_classification' => $a->abc_classification,
                'stock_turnover_ratio' => (float) $a->stock_turnover_ratio,
            ]);

        $totalValue = $analytics->sum('total_sold_value');

        return Inertia::render('Inventory::Reports/AbcAnalysis', [
            'analytics' => $analytics,
            'totalValue' => $totalValue,
        ]);
    }

    public function stockRotation(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $analytics = ProductAnalytics::with('product')
            ->orderBy('days_inventory_outstanding', 'asc')
            ->get()
            ->map(fn ($a) => [
                'product_id' => $a->product_id,
                'product_sku' => $a->product->sku,
                'product_name' => $a->product->name,
                'stock_turnover_ratio' => (float) $a->stock_turnover_ratio,
                'days_inventory_outstanding' => (int) $a->days_inventory_outstanding,
                'last_sold_at' => $a->last_sold_at,
                'days_since_last_sale' => (int) $a->days_since_last_sale,
            ]);

        return Inertia::render('Inventory::Reports/StockRotation', [
            'products' => $analytics,
        ]);
    }

    public function lowStock(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $stocks = StockQuantity::with('product', 'warehouse')
            ->whereHas('product', fn ($q) => $q->where('min_stock', '>', 0))
            ->get()
            ->filter(fn ($stock) => (float) $stock->quantity < (float) $stock->product->min_stock)
            ->map(fn ($stock) => [
                'product_id' => $stock->product_id,
                'product_sku' => $stock->product->sku,
                'product_name' => $stock->product->name,
                'warehouse' => $stock->warehouse->name,
                'current_stock' => (float) $stock->quantity,
                'min_stock' => (float) $stock->product->min_stock,
                'below_by' => (float) $stock->product->min_stock - (float) $stock->quantity,
            ]);

        return Inertia::render('Inventory::Reports/LowStock', [
            'products' => $stocks,
        ]);
    }

    public function reorderSuggestions(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $suggestions = ReorderSuggestion::with('product', 'warehouse')
            ->where('status', 'pending')
            ->orderBy('suggested_quantity', 'desc')
            ->get();

        return Inertia::render('Inventory::Reports/ReorderSuggestions', [
            'suggestions' => $suggestions,
        ]);
    }

    public function slowMoving(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $analytics = ProductAnalytics::with('product')
            ->where('obsolescence_status', 'slow_moving')
            ->orderBy('days_since_last_sale', 'desc')
            ->get();

        return Inertia::render('Inventory::Reports/SlowMoving', [
            'products' => $analytics,
        ]);
    }

    public function obsolete(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $analytics = ProductAnalytics::with('product')
            ->where('obsolescence_status', 'obsolete')
            ->get();

        return Inertia::render('Inventory::Reports/Obsolete', [
            'products' => $analytics,
        ]);
    }
}
