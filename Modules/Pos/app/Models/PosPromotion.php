<?php

namespace Modules\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class PosPromotion extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'type',
        'discount_value',
        'valid_from',
        'valid_to',
        'max_uses',
        'current_uses',
        'active',
    ];

    protected $casts = [
        'discount_value' => 'decimal:4',
        'valid_from' => 'datetime',
        'valid_to' => 'datetime',
        'active' => 'boolean',
    ];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(\Modules\Inventory\Models\Product::class, 'pos_promotion_products');
    }

    public function isActive(): bool
    {
        return $this->active && now()->between($this->valid_from, $this->valid_to ?? now()->addYears(100));
    }

    public function canUse(): bool
    {
        return $this->isActive() && (!$this->max_uses || $this->current_uses < $this->max_uses);
    }

    public function calculateDiscount(float $amount): float
    {
        return match($this->type) {
            'fixed' => (float) $this->discount_value,
            'percentage' => $amount * ((float) $this->discount_value / 100),
            'bogo' => 0,
            default => 0,
        };
    }
}
