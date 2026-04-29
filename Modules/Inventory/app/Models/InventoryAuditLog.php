<?php

namespace Modules\Inventory\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryAuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'entity_type',
        'entity_id',
        'action',
        'quantity_change',
        'old_values',
        'new_values',
        'reason',
        'ip_address',
        'created_at',
    ];

    protected $casts = [
        'old_values'      => 'json',
        'new_values'      => 'json',
        'quantity_change' => 'decimal:2',
        'created_at'      => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
