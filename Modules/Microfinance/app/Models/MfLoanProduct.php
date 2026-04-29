<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MfLoanProduct extends Model
{
    protected $table = 'mf_loan_products';

    protected $fillable = [
        'name','code','loan_type','currency','annual_rate','rate_calculation',
        'origination_fee_type','origination_fee_value','insurance_pct',
        'late_fee_type','late_fee_value','payment_frequency',
        'min_term_payments','max_term_payments','min_amount','max_amount',
        'cycle_limits','group_block_days','is_active','notes',
    ];

    protected $casts = [
        'cycle_limits'    => 'array',
        'is_active'       => 'boolean',
        'annual_rate'     => 'decimal:2',
        'insurance_pct'   => 'decimal:4',
        'late_fee_value'  => 'decimal:4',
    ];

    public function calculateOriginationFee(float $amount): float
    {
        return $this->origination_fee_type === 'pct'
            ? round($amount * $this->origination_fee_value / 100, 2)
            : (float) $this->origination_fee_value;
    }

    public function cycleLimitFor(int $cycle): ?float
    {
        if (empty($this->cycle_limits)) return null;
        foreach ($this->cycle_limits as $entry) {
            if ((int) $entry['cycle'] === $cycle) return (float) $entry['max_amount'];
        }
        return (float) end($this->cycle_limits)['max_amount'];
    }

    public function loans(): HasMany { return $this->hasMany(MfLoan::class, 'product_id'); }
}
