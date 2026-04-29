<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReorderSuggestion extends Model
{
    protected $table = 'inventory_reorder_suggestions';

    protected $fillable = [
        'product_id',
        'warehouse_id',
        'current_stock',
        'min_stock',
        'reorder_point',
        'suggested_quantity',
        'average_monthly_usage',
        'lead_time_days',
        'status',
        'dismissed_at',
        'dismissal_reason',
    ];

    protected $casts = [
        'current_stock' => 'decimal:4',
        'min_stock' => 'decimal:4',
        'reorder_point' => 'decimal:4',
        'suggested_quantity' => 'decimal:4',
        'average_monthly_usage' => 'decimal:4',
        'lead_time_days' => 'decimal:2',
        'dismissed_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }
}
