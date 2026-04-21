<?php

namespace Modules\RealEstate\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Modules\Contacts\Models\Contact;

class RealEstateDeal extends Model
{
    protected $table = 're_deals';

    protected $fillable = [
        'reference', 'property_id', 'lead_id', 'contact_id', 'deal_type', 'status',
        'reservation_amount', 'reservation_paid', 'reservation_date',
        'agreed_price', 'currency', 'rent_period', 'start_date', 'end_date',
        'contract_generated', 'contract_generated_at', 'contract_signed', 'contract_signed_at',
        'notes', 'internal_notes', 'cancellation_reason',
        'agent_id', 'created_by', 'completed_at', 'cancelled_at',
    ];

    protected $casts = [
        'reservation_amount'     => 'decimal:4',
        'reservation_paid'       => 'boolean',
        'reservation_date'       => 'date',
        'agreed_price'           => 'decimal:4',
        'start_date'             => 'date',
        'end_date'               => 'date',
        'contract_generated'     => 'boolean',
        'contract_generated_at'  => 'datetime',
        'contract_signed'        => 'boolean',
        'contract_signed_at'     => 'datetime',
        'completed_at'           => 'datetime',
        'cancelled_at'           => 'datetime',
    ];

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(RealEstateLead::class, 'lead_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(DealDocument::class, 'deal_id')->orderByDesc('created_at');
    }

    public function paymentPlan(): HasOne
    {
        return $this->hasOne(PaymentPlan::class, 'deal_id');
    }

    public function commissions(): HasMany
    {
        return $this->hasMany(Commission::class, 'deal_id');
    }

    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class, 'deal_id');
    }

    public static function generateReference(): string
    {
        $year   = now()->year;
        $prefix = "NE-{$year}-";
        $last   = static::where('reference', 'like', $prefix . '%')->orderByDesc('reference')->value('reference');
        $next   = $last ? ((int) substr($last, -4)) + 1 : 1;
        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    public function isDraft(): bool      { return $this->status === 'draft';      }
    public function isReserved(): bool   { return $this->status === 'reserved';   }
    public function isDocuments(): bool  { return $this->status === 'documents';  }
    public function isContract(): bool   { return $this->status === 'contract';   }
    public function isClosing(): bool    { return $this->status === 'closing';    }
    public function isCompleted(): bool  { return $this->status === 'completed';  }
    public function isCancelled(): bool  { return $this->status === 'cancelled';  }

    public function isEditable(): bool
    {
        return in_array($this->status, ['draft', 'reserved', 'documents']);
    }
}
