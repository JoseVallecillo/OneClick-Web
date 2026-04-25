<?php

namespace Modules\Barbershop\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BarbershopService extends Model
{
    protected $table = 'barbershop_services';

    protected $fillable = [
        'category_id',
        'name',
        'description',
        'duration_minutes',
        'price',
        'commission_rate',
        'active',
    ];

    protected $casts = [
        'price'           => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'active'          => 'boolean',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(BarbershopServiceCategory::class, 'category_id');
    }

    public function appointmentServices(): HasMany
    {
        return $this->hasMany(AppointmentService::class, 'service_id');
    }
}
