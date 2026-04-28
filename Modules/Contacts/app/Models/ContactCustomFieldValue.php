<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactCustomFieldValue extends Model
{
    protected $fillable = [
        'contact_id',
        'contact_custom_field_id',
        'value',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(ContactCustomField::class, 'contact_custom_field_id');
    }
}
