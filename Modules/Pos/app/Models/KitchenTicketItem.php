<?php

namespace Modules\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KitchenTicketItem extends Model
{
    protected $table = 'pos_kitchen_ticket_items';

    protected $fillable = [
        'kitchen_ticket_id',
        'product_id',
        'qty',
        'special_instructions',
    ];

    protected $casts = [
        'qty' => 'decimal:4',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(KitchenTicket::class, 'kitchen_ticket_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(\Modules\Inventory\Models\Product::class, 'product_id');
    }
}
