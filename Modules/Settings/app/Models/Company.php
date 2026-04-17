<?php

namespace Modules\Settings\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $fillable = [
        'commercial_name',
        'legal_name',
        'tax_id',
        'legal_representative',
        'logo_light',
        'logo_dark',
        'logo_pdf',
        'currency',
        'timezone',
        'date_format',
    ];

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }
}
