<?php

namespace Modules\Rentals\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Modules\Contacts\Models\Contact;

class RentalOrder extends Model
{
    protected $fillable = [
        'reference',
        'customer_id',
        'status',
        'start_date',
        'end_date',
        'pickup_type',
        'delivery_address',
        'deposit_amount',
        'deposit_status',
        'deposit_notes',
        'contract_signed',
        'signed_at',
        'subtotal',
        'tax_amount',
        'total',
        'damage_charges',
        'confirmed_at',
        'delivered_at',
        'returned_at',
        'invoiced_at',
        'closed_at',
        'invoice_number',
        'notes',
        'internal_notes',
        'created_by',
    ];

    protected $casts = [
        'start_date'      => 'date',
        'end_date'        => 'date',
        'contract_signed' => 'boolean',
        'deposit_amount'  => 'decimal:4',
        'subtotal'        => 'decimal:4',
        'tax_amount'      => 'decimal:4',
        'total'           => 'decimal:4',
        'damage_charges'  => 'decimal:4',
        'signed_at'       => 'datetime',
        'confirmed_at'    => 'datetime',
        'delivered_at'    => 'datetime',
        'returned_at'     => 'datetime',
        'invoiced_at'     => 'datetime',
        'closed_at'       => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'customer_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(RentalOrderLine::class)->orderBy('id');
    }

    public function deliveryChecklist(): HasOne
    {
        return $this->hasOne(RentalChecklist::class)->where('type', 'delivery');
    }

    public function returnChecklist(): HasOne
    {
        return $this->hasOne(RentalChecklist::class)->where('type', 'return');
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(RentalChecklist::class);
    }

    // -------------------------------------------------------------------------
    // Status helpers
    // -------------------------------------------------------------------------

    public function isDraft(): bool     { return $this->status === 'draft';     }
    public function isConfirmed(): bool { return $this->status === 'confirmed'; }
    public function isActive(): bool    { return $this->status === 'active';    }
    public function isReturned(): bool  { return $this->status === 'returned';  }
    public function isInvoiced(): bool  { return $this->status === 'invoiced';  }
    public function isClosed(): bool    { return $this->status === 'closed';    }

    public function isEditable(): bool  { return in_array($this->status, ['draft', 'confirmed']); }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------

    public static function generateReference(): string
    {
        $year   = now()->year;
        $prefix = "AL-{$year}-";

        $last = static::where('reference', 'like', $prefix . '%')
            ->orderByDesc('reference')
            ->value('reference');

        $next = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    public function recalculateTotals(): void
    {
        $lines            = $this->lines()->get();
        $this->subtotal   = $lines->sum('subtotal');
        $this->tax_amount = $lines->sum('tax_amount');
        $this->total      = $lines->sum('total');
        $this->save();
    }

    public function plannedDays(): int
    {
        return max(1, (int) $this->start_date->diffInDays($this->end_date));
    }

    public function actualDays(): int
    {
        if (! $this->delivered_at || ! $this->returned_at) {
            return $this->plannedDays();
        }

        return max(1, (int) $this->delivered_at->diffInDays($this->returned_at));
    }
}
