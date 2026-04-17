<?php

namespace Modules\Sales\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\Product;

class SalesOrderLine extends Model
{
    protected $fillable = [
        'sales_order_id',
        'product_id',
        'description',
        'qty',
        'qty_shipped',
        'unit_price',
        'tax_rate',
        'subtotal',
        'tax_amount',
        'total',
    ];

    protected $casts = [
        'qty'        => 'decimal:2',
        'qty_shipped' => 'decimal:2',
        'unit_price' => 'decimal:4',
        'tax_rate'   => 'decimal:2',
        'subtotal'   => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'total'      => 'decimal:4',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function order(): BelongsTo
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------

    /**
     * Recalculate and store subtotal, tax_amount and total from current qty/unit_price/tax_rate.
     */
    public function recalculateTotals(): void
    {
        $sub = (float) $this->qty * (float) $this->unit_price;
        $tax = $sub * ((float) $this->tax_rate / 100);

        $this->subtotal   = round($sub, 4);
        $this->tax_amount = round($tax, 4);
        $this->total      = round($sub + $tax, 4);
    }
}
