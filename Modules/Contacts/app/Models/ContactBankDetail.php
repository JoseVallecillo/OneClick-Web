<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactBankDetail extends Model
{
    protected $fillable = [
        'contact_id',
        'bank_name',
        'account_type',
        'account_number',
        'account_holder',
        'swift_code',
        'iban',
        'routing_number',
        'is_default',
        'active',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'active' => 'boolean',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
