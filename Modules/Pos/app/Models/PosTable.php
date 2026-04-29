<?php

namespace Modules\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosTable extends Model
{
    protected $fillable = [
        'number',
        'section',
        'shape',
        'capacity',
        'status',
        'server_name',
        'opened_at',
        'total',
        'pos_session_id',
        'current_sale_id',
        'current_order_id',
        'pos_waiter_id',
    ];

    protected $casts = [
        'total'     => 'decimal:4',
        'opened_at' => 'datetime',
        'capacity'  => 'integer',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(PosSession::class, 'pos_session_id');
    }

    public function currentOrder(): BelongsTo
    {
        return $this->belongsTo(PosOrder::class, 'current_order_id');
    }

    public function waiter(): BelongsTo
    {
        return $this->belongsTo(PosWaiter::class, 'pos_waiter_id');
    }

    public function timeOpen(): ?string
    {
        if (!$this->opened_at) {
            return null;
        }
        $minutes = (int) $this->opened_at->diffInMinutes(now());

        return $minutes < 60
            ? "{$minutes}min"
            : floor($minutes / 60) . 'h ' . ($minutes % 60) . 'min';
    }

    public function isAvailable(): bool   { return $this->status === 'available';    }
    public function isOccupied(): bool    { return $this->status === 'occupied';     }
    public function isPendingFood(): bool { return $this->status === 'pending_food'; }
}
