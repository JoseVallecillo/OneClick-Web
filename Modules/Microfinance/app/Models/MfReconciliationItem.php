<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MfReconciliationItem extends Model
{
    protected $table = 'mf_reconciliation_items';
    protected $fillable = ['reconciliation_id','loan_id','client_id','expected_amount','collected_amount','payment_method','status','notes'];

    public function reconciliation(): BelongsTo { return $this->belongsTo(MfPortfolioReconciliation::class, 'reconciliation_id'); }
    public function loan(): BelongsTo    { return $this->belongsTo(MfLoan::class, 'loan_id'); }
    public function client(): BelongsTo  { return $this->belongsTo(MfClient::class, 'client_id'); }
}
