<?php

namespace Modules\CarService\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServicePackage extends Model
{
    protected $fillable = [
        'name',
        'description',
        'oil_type',
        'oil_viscosity',
        'base_price',
        'active',
    ];

    protected $casts = [
        'base_price' => 'decimal:4',
        'active'     => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function items(): HasMany
    {
        return $this->hasMany(ServicePackageItem::class, 'service_package_id')->orderBy('id');
    }

    public function requiredItems(): HasMany
    {
        return $this->hasMany(ServicePackageItem::class, 'service_package_id')
            ->where('is_suggested', false);
    }

    public function suggestedItems(): HasMany
    {
        return $this->hasMany(ServicePackageItem::class, 'service_package_id')
            ->where('is_suggested', true);
    }
}
