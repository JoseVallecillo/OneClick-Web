<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockLot extends Model
{
    protected $fillable = [
        'product_id',
        'warehouse_id',
        'lot_number',
        'expiration_date',
        'qty_available',
        'unit_cost',
        'received_at',
        'notes',
    ];

    protected $casts = [
        'qty_available'   => 'decimal:2',
        'unit_cost'       => 'decimal:4',
        'expiration_date' => 'date',
        'received_at'     => 'date',
    ];

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('qty_available', '>', 0);
    }

    public function scopeFifo(Builder $query): Builder
    {
        return $query->orderBy('received_at', 'asc')->orderBy('id', 'asc');
    }

    public function scopeExpiringSoon(Builder $query, int $days = 30): Builder
    {
        return $query
            ->whereNotNull('expiration_date')
            ->where('expiration_date', '<=', now()->addDays($days));
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function moveLines(): HasMany
    {
        return $this->hasMany(StockMoveLine::class, 'lot_id');
    }
}
