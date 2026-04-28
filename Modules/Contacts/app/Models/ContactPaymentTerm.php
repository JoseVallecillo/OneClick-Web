<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactPaymentTerm extends Model
{
    protected $fillable = [
        'contact_id',
        'term_name',
        'days_to_pay',
        'is_default',
        'early_payment_discount',
        'discount_days',
        'late_payment_interest',
        'notes',
    ];

    protected $casts = [
        'early_payment_discount' => 'decimal:2',
        'late_payment_interest' => 'decimal:2',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
