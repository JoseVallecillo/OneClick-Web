<?php

namespace Modules\Barbershop\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BarberTimeBlock extends Model
{
    protected $table = 'barber_time_blocks';

    protected $fillable = [
        'barber_id',
        'block_date',
        'start_time',
        'end_time',
        'full_day',
        'reason',
    ];

    protected $casts = [
        'block_date' => 'date',
        'full_day'   => 'boolean',
    ];

    public function barber(): BelongsTo
    {
        return $this->belongsTo(Barber::class, 'barber_id');
    }
}
