<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FixedAsset extends Model
{
    protected $table = 'account_fixed_assets';

    protected $fillable = [
        'code',
        'name',
        'description',
        'account_id',
        'acquisition_cost',
        'acquisition_date',
        'depreciation_method',
        'useful_life_years',
        'residual_value',
        'accumulated_depreciation',
        'last_depreciation_date',
        'status',
        'retired_at',
    ];

    protected $casts = [
        'acquisition_cost'      => 'decimal:2',
        'residual_value'        => 'decimal:2',
        'accumulated_depreciation' => 'decimal:2',
        'acquisition_date'      => 'date',
        'last_depreciation_date' => 'date',
        'retired_at'            => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function netBookValue(): float
    {
        return (float) ($this->acquisition_cost - $this->accumulated_depreciation);
    }

    public function depreciableBase(): float
    {
        return (float) ($this->acquisition_cost - $this->residual_value);
    }

    public function annualDepreciation(): float
    {
        return $this->depreciableBase() / $this->useful_life_years;
    }

    public function monthlyDepreciation(): float
    {
        return $this->annualDepreciation() / 12;
    }
}
