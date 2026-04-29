<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryDepreciation extends Model
{
    protected $table = 'inventory_depreciation_records';

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'depreciation_date',
        'quantity_depreciated',
        'unit_cost',
        'total_depreciation_value',
        'reason',
        'notes',
        'state',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'depreciation_date' => 'date',
        'quantity_depreciated' => 'decimal:4',
        'unit_cost' => 'decimal:4',
        'total_depreciation_value' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
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
