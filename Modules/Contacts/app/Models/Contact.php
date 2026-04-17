<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contact extends Model
{
    protected $fillable = [
        'name',
        'legal_name',
        'rtn',
        'dni',
        'email',
        'phone',
        'mobile',
        'website',
        'is_client',
        'is_supplier',
        'is_employee',
        'notes',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'is_client'   => 'boolean',
            'is_supplier' => 'boolean',
            'is_employee' => 'boolean',
            'active'      => 'boolean',
        ];
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(ContactAddress::class)->orderBy('type')->orderBy('is_default', 'desc');
    }

    public function persons(): HasMany
    {
        return $this->hasMany(ContactPerson::class)->orderBy('name');
    }
}
