<?php

namespace Modules\Barbershop\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Appointment extends Model
{
    protected $table = 'barbershop_appointments';

    protected $fillable = [
        'reference',
        'client_id',
        'client_name',
        'client_phone',
        'barber_id',
        'appointment_date',
        'start_time',
        'end_time',
        'status',
        'source',
        'notes',
        'internal_notes',
        'subtotal',
        'discount',
        'total',
        'payment_method',
        'payment_status',
        'checked_in_at',
        'completed_at',
        'cancelled_at',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'subtotal'         => 'decimal:2',
        'discount'         => 'decimal:2',
        'total'            => 'decimal:2',
        'checked_in_at'    => 'datetime',
        'completed_at'     => 'datetime',
        'cancelled_at'     => 'datetime',
    ];

    public function scopeForDate(Builder $query, string $date): Builder
    {
        return $query->where('appointment_date', $date);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNotIn('status', ['cancelled', 'no_show']);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(BarbershopClient::class, 'client_id');
    }

    public function barber(): BelongsTo
    {
        return $this->belongsTo(Barber::class, 'barber_id');
    }

    public function services(): HasMany
    {
        return $this->hasMany(AppointmentService::class, 'appointment_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(AppointmentProduct::class, 'appointment_id');
    }

    public function recalculateTotals(): void
    {
        $this->subtotal = $this->services()->sum('price') + $this->products()->sum('total');
        $this->total    = max(0, $this->subtotal - $this->discount);
        $this->save();
    }

    public static function generateReference(): string
    {
        $prefix = 'APT-' . now()->format('ymd') . '-';
        $last   = static::where('reference', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->value('reference');

        $seq = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    public function isPending(): bool    { return $this->status === 'pending'; }
    public function isConfirmed(): bool  { return $this->status === 'confirmed'; }
    public function isInProgress(): bool { return $this->status === 'in_progress'; }
    public function isCompleted(): bool  { return $this->status === 'completed'; }
    public function isCancelled(): bool  { return $this->status === 'cancelled'; }
    public function isEditable(): bool   { return in_array($this->status, ['pending', 'confirmed']); }
}
