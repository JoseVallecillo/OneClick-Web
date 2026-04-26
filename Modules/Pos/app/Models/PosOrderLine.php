<?php

namespace Modules\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\Product;

class PosOrderLine extends Model
{
    protected $fillable = [
        'pos_order_id',
        'product_id',
        'qty',
        'unit_price',
        'tax_rate',
        'subtotal',
        'tax_amount',
        'total',
        'description',
        'notes',
        'status',
    ];

    protected $casts = [
        'qty'        => 'decimal:2',
        'unit_price' => 'decimal:4',
        'tax_rate'   => 'decimal:2',
        'subtotal'   => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'total'      => 'decimal:4',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(PosOrder::class, 'pos_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function recalculateTotals(): void
    {
        $sub = (float) $this->qty * (float) $this->unit_price;
        $tax = $sub * ((float) $this->tax_rate / 100);

        $this->subtotal   = round($sub, 4);
        $this->tax_amount = round($tax, 4);
        $this->total      = round($sub + $tax, 4);
    }
}
