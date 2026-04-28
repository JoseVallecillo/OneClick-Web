<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReconciliationItem extends Model
{
    protected $table = 'account_reconciliation_items';

    protected $fillable = [
        'reconciliation_id',
        'move_line_id',
        'transaction_date',
        'reference',
        'description',
        'amount',
        'type',
        'matched',
    ];

    protected $casts = [
        'amount'          => 'decimal:2',
        'transaction_date' => 'date',
        'matched'         => 'boolean',
    ];

    public function reconciliation(): BelongsTo
    {
        return $this->belongsTo(BankReconciliation::class, 'reconciliation_id');
    }

    public function moveLine(): BelongsTo
    {
        return $this->belongsTo(MoveLine::class, 'move_line_id');
    }
}
