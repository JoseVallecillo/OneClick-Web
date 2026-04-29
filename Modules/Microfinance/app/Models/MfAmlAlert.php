<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MfAmlAlert extends Model
{
    protected $table = 'mf_aml_alerts';
    protected $fillable = ['client_id','loan_id','alert_type','risk_level','amount_hnl','amount_usd','description','alert_date','status','reviewed_by','reviewed_at','reviewer_notes'];
    protected $casts = ['reviewed_at' => 'datetime', 'alert_date' => 'date'];

    /** Honduras AML thresholds: L.250,000 HNL or $10,000 USD */
    public static function checkAndCreate(int $clientId, float $amountHnl, ?float $amountUsd, string $type, ?int $loanId = null): ?self
    {
        $thresholdHnl = 250000;
        $thresholdUsd = 10000;
        $triggered = $amountHnl >= $thresholdHnl || ($amountUsd !== null && $amountUsd >= $thresholdUsd);
        if (!$triggered) return null;

        $level = match (true) {
            $amountHnl >= $thresholdHnl * 3   => 'high',
            $amountHnl >= $thresholdHnl * 1.5 => 'medium',
            default                            => 'low',
        };

        return static::create([
            'client_id'  => $clientId,
            'loan_id'    => $loanId,
            'alert_type' => $type,
            'risk_level' => $level,
            'amount_hnl' => $amountHnl,
            'amount_usd' => $amountUsd,
            'alert_date' => now()->toDateString(),
            'status'     => 'pending',
            'description' => "Transacción de L." . number_format($amountHnl, 2) . " supera umbral AML",
        ]);
    }

    public function client(): BelongsTo { return $this->belongsTo(MfClient::class, 'client_id'); }
    public function loan(): BelongsTo   { return $this->belongsTo(MfLoan::class, 'loan_id'); }
}
