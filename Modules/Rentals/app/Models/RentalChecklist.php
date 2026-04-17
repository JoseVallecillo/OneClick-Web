<?php

namespace Modules\Rentals\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RentalChecklist extends Model
{
    protected $fillable = [
        'rental_order_id',
        'type',
        'technician_id',
        'overall_condition',
        'notes',
    ];

    public function rentalOrder(): BelongsTo
    {
        return $this->belongsTo(RentalOrder::class);
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RentalChecklistItem::class)->orderBy('id');
    }

    public function hasDamages(): bool
    {
        return $this->items()->whereIn('condition', ['damaged', 'missing'])->exists();
    }
}
