<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryTransferLine extends Model
{
    protected $table = 'inventory_transfer_lines';

    protected $fillable = [
        'transfer_id',
        'product_id',
        'quantity_shipped',
        'quantity_received',
    ];

    protected $casts = [
        'quantity_shipped' => 'decimal:4',
        'quantity_received' => 'decimal:4',
    ];

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(InventoryTransfer::class, 'transfer_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
