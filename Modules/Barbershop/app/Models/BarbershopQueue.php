<?php

namespace Modules\Barbershop\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BarbershopQueue extends Model
{
    protected $table = 'barbershop_queue';

    protected $fillable = [
        'queue_date',
        'position',
        'client_name',
        'client_phone',
        'barber_id',
        'status',
        'notes',
        'arrived_at',
        'called_at',
        'done_at',
        'appointment_id',
    ];

    protected $casts = [
        'queue_date' => 'date',
        'arrived_at' => 'datetime',
        'called_at'  => 'datetime',
        'done_at'    => 'datetime',
    ];

    public function scopeForToday(Builder $query): Builder
    {
        return $query->where('queue_date', today()->toDateString());
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', ['waiting', 'called', 'in_service']);
    }

    public function barber(): BelongsTo
    {
        return $this->belongsTo(Barber::class, 'barber_id');
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }

    public static function nextPosition(string $date): int
    {
        return (static::where('queue_date', $date)->max('position') ?? 0) + 1;
    }
}
