<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Accounting\Models\Account;

class ProductCategory extends Model
{
    protected $fillable = [
        'name',
        'account_inventory_id',
        'account_income_id',
        'account_cogs_id',
        'image_path',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'category_id');
    }

    public function accountInventory(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_inventory_id');
    }

    public function accountIncome(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_income_id');
    }

    public function accountCogs(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_cogs_id');
    }
}
