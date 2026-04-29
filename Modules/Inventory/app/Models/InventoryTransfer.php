<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryTransfer extends Model
{
    protected $table = 'inventory_transfers';

    protected $fillable = [
        'reference',
        'transfer_date',
        'warehouse_from_id',
        'warehouse_to_id',
        'reason',
        'state',
        'shipped_at',
        'received_at',
    ];

    protected $casts = [
        'transfer_date' => 'date',
        'shipped_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    public function warehouseFrom(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_from_id');
    }

    public function warehouseTo(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_to_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(InventoryTransferLine::class, 'transfer_id');
    }
}
