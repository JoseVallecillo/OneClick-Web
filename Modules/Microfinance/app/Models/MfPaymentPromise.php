<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MfPaymentPromise extends Model
{
    protected $table = 'mf_payment_promises';
    protected $fillable = ['loan_id','client_id','registered_by','promise_date','promised_amount','status','contact_channel','paid_amount','paid_date','notes'];
    protected $casts = ['promise_date' => 'date', 'paid_date' => 'date'];

    public function loan(): BelongsTo   { return $this->belongsTo(MfLoan::class, 'loan_id'); }
    public function client(): BelongsTo { return $this->belongsTo(MfClient::class, 'client_id'); }
}
