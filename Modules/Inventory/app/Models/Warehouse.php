<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Settings\Models\Branch;

class Warehouse extends Model
{
    protected $fillable = [
        'branch_id',
        'name',
        'code',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    public function stockQuantities(): HasMany
    {
        return $this->hasMany(StockQuantity::class, 'warehouse_id');
    }

    public function stockLots(): HasMany
    {
        return $this->hasMany(StockLot::class, 'warehouse_id');
    }

    public function stockMoves(): HasMany
    {
        return $this->hasMany(StockMove::class, 'warehouse_id');
    }
}
