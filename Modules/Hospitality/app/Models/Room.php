<?php

namespace Modules\Hospitality\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Room extends Model
{
    protected $table = 'hospitality_rooms';

    protected $fillable = ['room_number', 'floor', 'status', 'room_type_id'];

    protected $casts = [
        'floor' => 'integer',
    ];

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class, 'room_type_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'room_id');
    }

    public function activeReservation(): HasOne
    {
        return $this->hasOne(Reservation::class, 'room_id')
            ->whereIn('status', ['confirmed', 'checked_in'])
            ->latest('id');
    }

    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }
}
