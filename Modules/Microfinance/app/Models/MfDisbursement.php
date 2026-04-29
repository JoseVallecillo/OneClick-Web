<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MfDisbursement extends Model
{
    protected $table = 'mf_disbursements';
    protected $fillable = ['loan_id','processed_by','amount','channel','bank_name','account_number','check_number','transfer_reference','disbursement_date','status','notes'];
    protected $casts = ['disbursement_date' => 'date'];

    public function loan(): BelongsTo { return $this->belongsTo(MfLoan::class, 'loan_id'); }
}
