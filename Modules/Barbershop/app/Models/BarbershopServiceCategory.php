<?php

namespace Modules\Barbershop\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BarbershopServiceCategory extends Model
{
    protected $table = 'barbershop_service_categories';

    protected $fillable = ['name', 'color', 'active'];

    protected $casts = ['active' => 'boolean'];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    public function services(): HasMany
    {
        return $this->hasMany(BarbershopService::class, 'category_id');
    }
}
