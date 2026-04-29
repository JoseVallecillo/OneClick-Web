<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MfLateFeeAccrual extends Model
{
    protected $table = 'mf_late_fee_accruals';
    protected $fillable = ['loan_id','accrual_date','fee_amount','principal_balance_at','fee_type'];
    protected $casts = ['accrual_date' => 'date'];

    public function loan(): BelongsTo { return $this->belongsTo(MfLoan::class, 'loan_id'); }
}
