<?php

namespace Modules\Barbershop\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BarberSchedule extends Model
{
    protected $table = 'barber_schedules';

    protected $fillable = [
        'barber_id',
        'day_of_week',
        'is_working',
        'start_time',
        'end_time',
        'break_start',
        'break_end',
    ];

    protected $casts = [
        'is_working'  => 'boolean',
        'day_of_week' => 'integer',
    ];

    public function barber(): BelongsTo
    {
        return $this->belongsTo(Barber::class, 'barber_id');
    }
}
