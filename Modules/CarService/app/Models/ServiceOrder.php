<?php

namespace Modules\CarService\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Modules\Contacts\Models\Contact;

class ServiceOrder extends Model
{
    protected $fillable = [
        'reference',
        'vehicle_id',
        'customer_id',
        'status',
        'odometer_in',
        'odometer_out',
        'photo_front',
        'photo_side',
        'photo_rear',
        'photo_right',
        'inspection_notes',
        'service_package_id',
        'oil_type',
        'oil_viscosity',
        'next_service_km',
        'next_service_date',
        'qr_token',
        'brake_fluid_pct',
        'air_filter_status',
        'cabin_filter_status',
        'battery_voltage',
        'checks_notes',
        'subtotal',
        'tax_amount',
        'total',
        'checked_in_at',
        'completed_at',
        'cancelled_at',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'odometer_in'      => 'integer',
        'odometer_out'     => 'integer',
        'next_service_km'  => 'integer',
        'next_service_date' => 'date',
        'brake_fluid_pct'  => 'decimal:2',
        'battery_voltage'  => 'decimal:2',
        'subtotal'         => 'decimal:4',
        'tax_amount'       => 'decimal:4',
        'total'            => 'decimal:4',
        'checked_in_at'    => 'datetime',
        'completed_at'     => 'datetime',
        'cancelled_at'     => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'customer_id');
    }

    public function servicePackage(): BelongsTo
    {
        return $this->belongsTo(ServicePackage::class, 'service_package_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(ServiceOrderLine::class, 'service_order_id')->orderBy('id');
    }

    // -------------------------------------------------------------------------
    // Status helpers
    // -------------------------------------------------------------------------

    public function isDraft(): bool       { return $this->status === 'draft';       }
    public function isInProgress(): bool  { return $this->status === 'in_progress'; }
    public function isCompleted(): bool   { return $this->status === 'completed';   }
    public function isCancelled(): bool   { return $this->status === 'cancelled';   }

    public function isEditable(): bool    { return in_array($this->status, ['draft', 'in_progress']); }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------

    /**
     * Generate the next sequential reference in the format CS-YYYY-NNNN.
     */
    public static function generateReference(): string
    {
        $year   = now()->year;
        $prefix = "CS-{$year}-";

        $last = static::where('reference', 'like', $prefix . '%')
            ->orderByDesc('reference')
            ->value('reference');

        $next = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Calculate next service kilometer based on oil type.
     *   mineral:       +5,000 km
     *   semi_synthetic: +7,500 km
     *   synthetic:     +10,000 km
     */
    public static function nextServiceInterval(string $oilType): int
    {
        return match ($oilType) {
            'mineral'       => 5000,
            'semi_synthetic' => 7500,
            'synthetic'     => 10000,
            default         => 5000,
        };
    }

    /**
     * Recalculate and persist order-level totals from its lines.
     */
    public function recalculateTotals(): void
    {
        $lines = $this->lines()->get();

        $this->subtotal   = $lines->sum('subtotal');
        $this->tax_amount = $lines->sum('tax_amount');
        $this->total      = $lines->sum('total');
        $this->save();
    }

    /**
     * Generate a unique token for the public QR history page.
     */
    public static function generateQrToken(): string
    {
        do {
            $token = Str::random(32);
        } while (static::where('qr_token', $token)->exists());

        return $token;
    }
}
