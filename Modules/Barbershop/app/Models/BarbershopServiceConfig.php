<?php

namespace Modules\Barbershop\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\Product;

class BarbershopServiceConfig extends Model
{
    protected $table = 'barbershop_service_configs';

    protected $fillable = [
        'product_id',
        'duration_minutes',
        'commission_rate',
        'active',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'active'          => 'boolean',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
