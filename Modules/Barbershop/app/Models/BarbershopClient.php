<?php

namespace Modules\Barbershop\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BarbershopClient extends Model
{
    protected $table = 'barbershop_clients';

    protected $fillable = [
        'name',
        'phone',
        'email',
        'birthdate',
        'preferred_style',
        'notes',
        'preferred_barber_id',
        'total_visits',
        'total_spent',
        'last_visit_at',
        'active',
    ];

    protected $casts = [
        'birthdate'     => 'date',
        'last_visit_at' => 'datetime',
        'total_spent'   => 'decimal:2',
        'active'        => 'boolean',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    public function preferredBarber(): BelongsTo
    {
        return $this->belongsTo(Barber::class, 'preferred_barber_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'client_id');
    }

    public function refreshStats(): void
    {
        $completed = $this->appointments()->where('status', 'completed');
        $this->total_visits = $completed->count();
        $this->total_spent  = $completed->sum('total');
        $this->last_visit_at = $completed->max('completed_at');
        $this->save();
    }
}
