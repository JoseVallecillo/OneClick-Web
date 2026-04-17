<?php

namespace Modules\Inventory\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Inventory\Models\Product;
use Modules\Inventory\Models\StockLot;
use Modules\Inventory\Models\Warehouse;

class StockLotController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = StockLot::with([
            'product.category',
            'warehouse',
        ]);

        if ($productId = $request->input('product_id')) {
            $query->where('product_id', $productId);
        }

        if ($warehouseId = $request->input('warehouse_id')) {
            $query->where('warehouse_id', $warehouseId);
        }

        if ($expiringDays = $request->input('expiring_days')) {
            $query->whereNotNull('expiration_date')
                  ->where('expiration_date', '<=', now()->addDays((int) $expiringDays));
        }

        $lots = $query->orderByDesc('received_at')->orderByDesc('id')->paginate(50)->withQueryString();

        return Inertia::render('Inventory::Lots/Index', [
            'lots'       => $lots,
            'products'   => Product::where('active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'sku', 'tracking']),
            'warehouses' => Warehouse::where('active', true)->orderBy('name')->get(),
            'filters'    => $request->only(['product_id', 'warehouse_id', 'expiring_days']),
        ]);
    }
}
