<?php

namespace Modules\CarService\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Contacts\Models\Contact;

class Vehicle extends Model
{
    protected $fillable = [
        'plate',
        'vin',
        'make',
        'model',
        'year',
        'color',
        'engine',
        'transmission',
        'customer_id',
        'last_odometer',
        'notes',
        'active',
    ];

    protected $casts = [
        'active'        => 'boolean',
        'last_odometer' => 'integer',
        'year'          => 'integer',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'customer_id');
    }

    public function serviceOrders(): HasMany
    {
        return $this->hasMany(ServiceOrder::class, 'vehicle_id')->orderByDesc('id');
    }

    public function lastServiceOrder(): HasMany
    {
        return $this->hasMany(ServiceOrder::class, 'vehicle_id')
            ->where('status', 'completed')
            ->orderByDesc('completed_at');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function getDisplayNameAttribute(): string
    {
        return "{$this->plate} — {$this->make} {$this->model}" . ($this->year ? " ({$this->year})" : '');
    }
}
