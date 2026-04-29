<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MfLoanPayment extends Model
{
    protected $table = 'mf_loan_payments';
    protected $fillable = ['loan_id','schedule_id','collected_by','reconciliation_id','payment_date','amount','principal_applied','interest_applied','late_fee_applied','insurance_applied','payment_method','receipt_number','notes','reconciled'];
    protected $casts = ['payment_date' => 'date', 'reconciled' => 'boolean'];

    public function loan(): BelongsTo { return $this->belongsTo(MfLoan::class, 'loan_id'); }
}
