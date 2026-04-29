<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MfPortfolioReconciliation extends Model
{
    protected $table = 'mf_portfolio_reconciliations';
    protected $fillable = ['advisor_id','reconciliation_date','expected_amount','submitted_amount','verified_amount','difference','status','verified_by','submitted_at','verified_at','notes'];
    protected $casts = ['reconciliation_date' => 'date', 'submitted_at' => 'datetime', 'verified_at' => 'datetime'];

    public function items(): HasMany { return $this->hasMany(MfReconciliationItem::class, 'reconciliation_id'); }
}
