<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PhysicalCount extends Model
{
    protected $table = 'inventory_physical_counts';

    protected $fillable = [
        'reference',
        'count_date',
        'warehouse_id',
        'notes',
        'state',
        'completed_at',
        'reconciled_at',
        'created_by',
    ];

    protected $casts = [
        'count_date' => 'date',
        'completed_at' => 'datetime',
        'reconciled_at' => 'datetime',
    ];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PhysicalCountLine::class, 'count_id');
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo('App\Models\User', 'created_by');
    }
}
