<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetLine extends Model
{
    protected $table = 'account_budget_lines';

    protected $fillable = [
        'budget_id',
        'account_id',
        'budgeted_amount',
        'notes',
    ];

    protected $casts = [
        'budgeted_amount' => 'decimal:2',
    ];

    public function budget(): BelongsTo
    {
        return $this->belongsTo(Budget::class, 'budget_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function actualAmount(): float
    {
        $lines = MoveLine::where('account_id', $this->account_id)
            ->whereHas('move', fn ($q) => $q->where('state', 'posted'))
            ->whereBetween('account_moves.date', [$this->budget->date_from, $this->budget->date_to])
            ->get();

        return (float) $lines->sum(fn ($line) => $line->debit - $line->credit);
    }

    public function variance(): float
    {
        return (float) ($this->budgeted_amount - $this->actualAmount());
    }
}
