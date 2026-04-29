<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryReturn extends Model
{
    protected $table = 'inventory_returns';

    protected $fillable = [
        'reference',
        'return_date',
        'source_type',
        'source_id',
        'reason',
        'notes',
        'state',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'return_date' => 'date',
        'approved_at' => 'datetime',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(InventoryReturnLine::class, 'return_id');
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
