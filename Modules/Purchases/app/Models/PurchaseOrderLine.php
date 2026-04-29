<?php

namespace Modules\Purchases\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\Product;

class PurchaseOrderLine extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'product_id',
        'description',
        'qty',
        'qty_received',
        'unit_cost',
        'tax_rate',
        'subtotal',
        'tax_amount',
        'total',
    ];

    protected $casts = [
        'qty'          => 'decimal:2',
        'qty_received' => 'decimal:2',
        'unit_cost'    => 'decimal:4',
        'tax_rate'     => 'decimal:2',
        'subtotal'     => 'decimal:4',
        'tax_amount'   => 'decimal:4',
        'total'        => 'decimal:4',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function order(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'purchase_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------

    /**
     * Recalculate and store subtotal, tax_amount and total from current qty/unit_cost/tax_rate.
     */
    public function recalculateTotals(): void
    {
        $sub        = (float) $this->qty * (float) $this->unit_cost;
        $tax        = $sub * ((float) $this->tax_rate / 100);

        $this->subtotal   = round($sub, 4);
        $this->tax_amount = round($tax, 4);
        $this->total      = round($sub + $tax, 4);
    }
}
