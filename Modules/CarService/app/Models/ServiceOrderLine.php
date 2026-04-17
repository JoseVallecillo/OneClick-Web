<?php

namespace Modules\CarService\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\Product;

class ServiceOrderLine extends Model
{
    protected $fillable = [
        'service_order_id',
        'product_id',
        'warehouse_id',
        'description',
        'qty',
        'unit_price',
        'tax_rate',
        'subtotal',
        'tax_amount',
        'total',
        'is_upsell',
        'upsell_type',
    ];

    protected $casts = [
        'qty'        => 'decimal:4',
        'unit_price' => 'decimal:4',
        'tax_rate'   => 'decimal:4',
        'subtotal'   => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'total'      => 'decimal:4',
        'is_upsell'  => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function order(): BelongsTo
    {
        return $this->belongsTo(ServiceOrder::class, 'service_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(\Modules\Inventory\Models\Warehouse::class, 'warehouse_id');
    }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------

    public function recalculateTotals(): void
    {
        $this->subtotal   = round((float) $this->qty * (float) $this->unit_price, 4);
        $this->tax_amount = round((float) $this->subtotal * (float) $this->tax_rate / 100, 4);
        $this->total      = round((float) $this->subtotal + (float) $this->tax_amount, 4);
    }
}
