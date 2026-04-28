<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContactCustomField extends Model
{
    protected $fillable = [
        'field_name',
        'field_type',
        'contact_type',
        'is_required',
        'options',
    ];

    protected $casts = [
        'options' => 'json',
        'is_required' => 'boolean',
    ];

    public function values(): HasMany
    {
        return $this->hasMany(ContactCustomFieldValue::class);
    }
}
