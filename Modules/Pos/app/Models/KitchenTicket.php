<?php

namespace Modules\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KitchenTicket extends Model
{
    protected $table = 'pos_kitchen_tickets';

    protected $fillable = [
        'pos_order_id',
        'status',
        'special_notes',
        'printed_at',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'printed_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(PosOrder::class, 'pos_order_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(KitchenTicketItem::class, 'kitchen_ticket_id');
    }

    public function start(): void
    {
        $this->update(['status' => 'in_progress', 'started_at' => now()]);
    }

    public function complete(): void
    {
        $this->update(['status' => 'completed', 'completed_at' => now()]);
    }

    public function cancel(): void
    {
        $this->update(['status' => 'cancelled']);
    }
}
