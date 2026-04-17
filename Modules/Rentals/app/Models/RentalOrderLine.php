<?php

namespace Modules\Rentals\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\Product;
use Modules\Inventory\Models\StockLot;

class RentalOrderLine extends Model
{
    protected $fillable = [
        'rental_order_id',
        'product_id',
        'lot_id',
        'description',
        'qty',
        'rate_type',
        'unit_price',
        'duration',
        'discount_pct',
        'tax_rate',
        'subtotal',
        'tax_amount',
        'total',
    ];

    protected $casts = [
        'qty'          => 'decimal:2',
        'unit_price'   => 'decimal:4',
        'duration'     => 'decimal:2',
        'discount_pct' => 'decimal:2',
        'tax_rate'     => 'decimal:2',
        'subtotal'     => 'decimal:4',
        'tax_amount'   => 'decimal:4',
        'total'        => 'decimal:4',
    ];

    public function rentalOrder(): BelongsTo
    {
        return $this->belongsTo(RentalOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(StockLot::class, 'lot_id');
    }

    public function recalculateTotals(): void
    {
        $base             = (float) $this->qty * (float) $this->unit_price * (float) $this->duration;
        $discounted       = $base * (1 - ((float) $this->discount_pct / 100));
        $this->subtotal   = $discounted;
        $this->tax_amount = $discounted * ((float) $this->tax_rate / 100);
        $this->total      = $this->subtotal + $this->tax_amount;
    }
}
