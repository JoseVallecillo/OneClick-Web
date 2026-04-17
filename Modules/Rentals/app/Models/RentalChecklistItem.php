<?php

namespace Modules\Rentals\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RentalChecklistItem extends Model
{
    protected $fillable = [
        'rental_checklist_id',
        'rental_order_line_id',
        'label',
        'condition',
        'notes',
        'photo_path',
    ];

    public function checklist(): BelongsTo
    {
        return $this->belongsTo(RentalChecklist::class, 'rental_checklist_id');
    }

    public function orderLine(): BelongsTo
    {
        return $this->belongsTo(RentalOrderLine::class, 'rental_order_line_id');
    }

    public function isDamaged(): bool
    {
        return in_array($this->condition, ['damaged', 'missing']);
    }
}
