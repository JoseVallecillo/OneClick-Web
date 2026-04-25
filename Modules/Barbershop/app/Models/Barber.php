<?php

namespace Modules\Barbershop\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Barber extends Model
{
    protected $table = 'barbers';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'bio',
        'photo',
        'color',
        'commission_rate',
        'accepts_walk_ins',
        'active',
    ];

    protected $casts = [
        'commission_rate'  => 'decimal:2',
        'accepts_walk_ins' => 'boolean',
        'active'           => 'boolean',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(BarberSchedule::class, 'barber_id');
    }

    public function timeBlocks(): HasMany
    {
        return $this->hasMany(BarberTimeBlock::class, 'barber_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'barber_id');
    }

    public function clients(): HasMany
    {
        return $this->hasMany(BarbershopClient::class, 'preferred_barber_id');
    }

    public function getScheduleForDay(int $dayOfWeek): ?BarberSchedule
    {
        return $this->schedules->firstWhere('day_of_week', $dayOfWeek);
    }

    public function totalRevenueForMonth(int $year, int $month): float
    {
        return (float) $this->appointments()
            ->whereYear('appointment_date', $year)
            ->whereMonth('appointment_date', $month)
            ->where('status', 'completed')
            ->sum('total');
    }

    public function appointmentsCountForMonth(int $year, int $month): int
    {
        return $this->appointments()
            ->whereYear('appointment_date', $year)
            ->whereMonth('appointment_date', $month)
            ->where('status', 'completed')
            ->count();
    }
}
