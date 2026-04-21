<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Modules\Rentals\Models\RentalRate;
use Modules\Accounting\Models\Tax;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'uom_id',
        'tax_rate_id',
        'sku',
        'name',
        'description',
        'type',
        'tracking',
        'valuation',
        'cost',
        'price',
        'min_stock',
        'active',
    ];

    protected $casts = [
        'cost'      => 'decimal:4',
        'price'     => 'decimal:4',
        'min_stock' => 'decimal:2',
        'active'    => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    /**
     * Products whose total stock across all warehouses is below min_stock.
     */
    public function scopeLowStock(Builder $query): Builder
    {
        return $query
            ->leftJoin('stock_quantities', 'products.id', '=', 'stock_quantities.product_id')
            ->groupBy('products.id')
            ->havingRaw('COALESCE(SUM(stock_quantities.quantity), 0) < products.min_stock');
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function uom(): BelongsTo
    {
        return $this->belongsTo(UnitOfMeasure::class, 'uom_id');
    }

    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(Tax::class, 'tax_rate_id');
    }

    public function stockQuantities(): HasMany
    {
        return $this->hasMany(StockQuantity::class, 'product_id');
    }

    public function stockLots(): HasMany
    {
        return $this->hasMany(StockLot::class, 'product_id');
    }

    public function stockMoveLines(): HasMany
    {
        return $this->hasMany(StockMoveLine::class, 'product_id');
    }

    public function rentalRate(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(RentalRate::class, 'product_id');
    }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------

    /**
     * Returns the physical stock quantity (including reserved) in the given warehouse.
     */
    public function physicalStockInWarehouse(int $warehouseId): float
    {
        $record = DB::table('stock_quantities')
            ->where('product_id', $this->id)
            ->where('warehouse_id', $warehouseId)
            ->first();

        return $record ? (float) $record->quantity : 0.0;
    }

    /**
     * Returns the reserved quantity in the given warehouse.
     */
    public function reservedStockInWarehouse(int $warehouseId): float
    {
        $record = DB::table('stock_quantities')
            ->where('product_id', $this->id)
            ->where('warehouse_id', $warehouseId)
            ->first();

        return $record ? (float) $record->reserved_quantity : 0.0;
    }

    /**
     * Returns the AVAILABLE stock quantity of this product in the given warehouse.
     * Available = Physical - Reserved.
     */
    public function stockInWarehouse(int $warehouseId): float
    {
        $record = DB::table('stock_quantities')
            ->where('product_id', $this->id)
            ->where('warehouse_id', $warehouseId)
            ->first();

        if (!$record) return 0.0;

        return (float) $record->quantity - (float) $record->reserved_quantity;
    }

    /**
     * Returns the sum of physical stock across all warehouses.
     */
    public function totalPhysicalStock(): float
    {
        return (float) DB::table('stock_quantities')
            ->where('product_id', $this->id)
            ->sum('quantity');
    }

    /**
     * Returns the sum of AVAILABLE stock quantities across all warehouses.
     */
    public function totalStock(): float
    {
        $record = DB::table('stock_quantities')
            ->where('product_id', $this->id)
            ->selectRaw('SUM(quantity) as total_qty, SUM(reserved_quantity) as total_reserved')
            ->first();

        if (!$record) return 0.0;

        return (float) $record->total_qty - (float) $record->total_reserved;
    }

    /**
     * Recalculates the weighted average cost from remaining lots in a warehouse.
     *
     * Formula: sum(qty_available * unit_cost) / sum(qty_available)
     * Only updates when sum(qty_available) > 0.
     */
    public function recalculateAverageCost(int $warehouseId): void
    {
        $result = DB::table('stock_lots')
            ->where('product_id', $this->id)
            ->where('warehouse_id', $warehouseId)
            ->where('qty_available', '>', 0)
            ->selectRaw('SUM(qty_available) as total_qty, SUM(qty_available * unit_cost) as total_value')
            ->first();

        if ($result && (float) $result->total_qty > 0) {
            $this->cost = bcdiv((string) $result->total_value, (string) $result->total_qty, 4);
            $this->save();
        }
    }
}
