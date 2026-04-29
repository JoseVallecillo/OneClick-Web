<?php

namespace Modules\Rentals\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\Product;
use Modules\Inventory\Models\StockLot;

class RentalMaintenance extends Model
{
    protected $fillable = [
        'product_id',
        'lot_id',
        'maintenance_type',
        'status',
        'scheduled_at',
        'started_at',
        'completed_at',
        'usage_days_at_trigger',
        'description',
        'resolution_notes',
        'cost',
        'created_by',
    ];

    protected $casts = [
        'scheduled_at'         => 'datetime',
        'started_at'           => 'datetime',
        'completed_at'         => 'datetime',
        'usage_days_at_trigger' => 'integer',
        'cost'                 => 'decimal:4',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function lot(): BelongsTo
    {
        return $this->belongsTo(StockLot::class, 'lot_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isScheduled(): bool   { return $this->status === 'scheduled';   }
    public function isInProgress(): bool  { return $this->status === 'in_progress'; }
    public function isCompleted(): bool   { return $this->status === 'completed';   }
}
