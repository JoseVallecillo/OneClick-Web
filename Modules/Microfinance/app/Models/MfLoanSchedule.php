<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MfLoanSchedule extends Model
{
    protected $table = 'mf_loan_schedules';
    protected $fillable = ['loan_id','installment_number','due_date','principal','interest','insurance','total_due','balance_after','paid_amount','status','paid_date'];
    protected $casts = ['due_date' => 'date', 'paid_date' => 'date'];

    public function loan(): BelongsTo { return $this->belongsTo(MfLoan::class, 'loan_id'); }
}
