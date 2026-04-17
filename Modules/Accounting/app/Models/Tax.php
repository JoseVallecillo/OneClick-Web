<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tax extends Model
{
    protected $table = 'account_taxes';

    protected $fillable = [
        'name',
        'code',
        'type',
        'rate',
        'tax_scope',
        'tax_account_id',
        'refund_account_id',
        'active',
    ];

    protected $casts = [
        'rate'   => 'decimal:2',
        'active' => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function accounts(): HasMany
    {
        return $this->hasMany(Account::class, 'tax_id');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function isExempt(): bool
    {
        return $this->type === 'exempt' || $this->rate == 0;
    }

    public function computeAmount(float $base): float
    {
        if ($this->type === 'percentage') {
            return round($base * ($this->rate / 100), 4);
        }

        if ($this->type === 'fixed') {
            return (float) $this->rate;
        }

        return 0.0;
    }
}
