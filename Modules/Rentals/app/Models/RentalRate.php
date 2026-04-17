<?php

namespace Modules\Rentals\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\Product;

class RentalRate extends Model
{
    protected $fillable = [
        'product_id',
        'hourly_price',
        'daily_price',
        'weekly_price',
        'monthly_price',
        'deposit_amount',
        'buffer_hours_before',
        'buffer_hours_after',
        'maintenance_limit_days',
        'notes',
    ];

    protected $casts = [
        'hourly_price'           => 'decimal:4',
        'daily_price'            => 'decimal:4',
        'weekly_price'           => 'decimal:4',
        'monthly_price'          => 'decimal:4',
        'deposit_amount'         => 'decimal:4',
        'buffer_hours_before'    => 'integer',
        'buffer_hours_after'     => 'integer',
        'maintenance_limit_days' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function priceFor(string $rateType): float
    {
        return match ($rateType) {
            'hourly'  => (float) $this->hourly_price,
            'daily'   => (float) $this->daily_price,
            'weekly'  => (float) $this->weekly_price,
            'monthly' => (float) $this->monthly_price,
            default   => (float) $this->daily_price,
        };
    }
}
