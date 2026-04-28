<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductCostHistory extends Model
{
    protected $table = 'inventory_product_cost_history';

    protected $fillable = [
        'product_id',
        'cost',
        'price',
        'effective_from',
        'effective_to',
        'reason',
        'notes',
        'changed_by',
    ];

    protected $casts = [
        'cost' => 'decimal:4',
        'price' => 'decimal:4',
        'effective_from' => 'datetime',
        'effective_to' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function changedByUser(): BelongsTo
    {
        return $this->belongsTo('App\Models\User', 'changed_by');
    }
}
