<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhysicalCountLine extends Model
{
    protected $table = 'inventory_count_lines';

    protected $fillable = [
        'count_id',
        'product_id',
        'system_quantity',
        'counted_quantity',
        'variance',
        'notes',
    ];

    protected $casts = [
        'system_quantity' => 'decimal:4',
        'counted_quantity' => 'decimal:4',
        'variance' => 'decimal:4',
    ];

    public function count(): BelongsTo
    {
        return $this->belongsTo(PhysicalCount::class, 'count_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
