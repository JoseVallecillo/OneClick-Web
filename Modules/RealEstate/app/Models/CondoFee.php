<?php

namespace Modules\RealEstate\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Contacts\Models\Contact;

class CondoFee extends Model
{
    protected $table = 're_condo_fees';

    protected $fillable = [
        'reference', 'property_id', 'contact_id', 'period_year', 'period_month',
        'amount', 'due_date', 'status', 'paid_at', 'payment_reference',
        'invoice_number', 'notes', 'created_by', 'recorded_by',
    ];

    protected $casts = [
        'amount'   => 'decimal:4',
        'due_date' => 'date',
        'paid_at'  => 'datetime',
    ];

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public static function generateReference(): string
    {
        $year   = now()->year;
        $prefix = "CF-{$year}-";
        $last   = static::where('reference', 'like', $prefix . '%')->orderByDesc('reference')->value('reference');
        $next   = $last ? ((int) substr($last, -4)) + 1 : 1;
        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    public function getPeriodLabelAttribute(): string
    {
        $months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        return ($months[$this->period_month - 1] ?? '?') . ' ' . $this->period_year;
    }
}
