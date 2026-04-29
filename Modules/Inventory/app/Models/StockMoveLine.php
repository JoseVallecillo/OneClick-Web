<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMoveLine extends Model
{
    protected $fillable = [
        'stock_move_id',
        'product_id',
        'lot_id',
        'qty',
        'unit_cost',
        // NOTE: total_cost is a stored computed column — excluded from fillable
    ];

    protected $casts = [
        'qty'        => 'decimal:2',
        'unit_cost'  => 'decimal:4',
        'total_cost' => 'decimal:4',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function move(): BelongsTo
    {
        return $this->belongsTo(StockMove::class, 'stock_move_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(StockLot::class, 'lot_id');
    }
}
