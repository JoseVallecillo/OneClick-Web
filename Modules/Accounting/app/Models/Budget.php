<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Budget extends Model
{
    protected $table = 'account_budgets';

    protected $fillable = [
        'name',
        'description',
        'date_from',
        'date_to',
        'status',
    ];

    protected $casts = [
        'date_from' => 'date',
        'date_to'   => 'date',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(BudgetLine::class, 'budget_id');
    }

    public function totalBudgeted(): float
    {
        return (float) $this->lines()->sum('budgeted_amount');
    }
}
