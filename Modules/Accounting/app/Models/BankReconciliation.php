<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankReconciliation extends Model
{
    protected $table = 'account_bank_reconciliations';

    protected $fillable = [
        'account_id',
        'statement_date',
        'statement_balance',
        'book_balance',
        'difference',
        'status',
        'notes',
        'reconciled_at',
        'reconciled_by',
    ];

    protected $casts = [
        'statement_balance' => 'decimal:2',
        'book_balance'      => 'decimal:2',
        'difference'        => 'decimal:2',
        'statement_date'    => 'date',
        'reconciled_at'     => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ReconciliationItem::class, 'reconciliation_id');
    }

    public function isReconciled(): bool
    {
        return abs((float) $this->difference) < 0.01;
    }
}
