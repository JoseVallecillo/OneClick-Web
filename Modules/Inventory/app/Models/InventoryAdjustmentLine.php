<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryAdjustmentLine extends Model
{
    protected $table = 'inventory_adjustment_lines';

    protected $fillable = [
        'adjustment_id',
        'product_id',
        'quantity_before',
        'quantity_after',
        'quantity_diff',
        'unit_cost',
        'notes',
    ];

    protected $casts = [
        'quantity_before' => 'decimal:4',
        'quantity_after' => 'decimal:4',
        'quantity_diff' => 'decimal:4',
        'unit_cost' => 'decimal:4',
    ];

    public function adjustment(): BelongsTo
    {
        return $this->belongsTo(InventoryAdjustment::class, 'adjustment_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
