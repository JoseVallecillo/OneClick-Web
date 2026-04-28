<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryAdjustment extends Model
{
    protected $table = 'inventory_adjustments';

    protected $fillable = [
        'reference',
        'adjustment_date',
        'warehouse_id',
        'type',
        'reason',
        'state',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'adjustment_date' => 'date',
        'approved_at' => 'datetime',
    ];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(InventoryAdjustmentLine::class, 'adjustment_id');
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo('App\Models\User', 'created_by');
    }

    public function approvedByUser(): BelongsTo
    {
        return $this->belongsTo('App\Models\User', 'approved_by');
    }
}
