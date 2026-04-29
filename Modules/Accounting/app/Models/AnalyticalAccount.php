<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AnalyticalAccount extends Model
{
    protected $table = 'account_analytical_accounts';

    protected $fillable = [
        'code',
        'name',
        'description',
        'account_id',
        'parent_id',
        'is_leaf',
        'active',
    ];

    protected $casts = [
        'is_leaf' => 'boolean',
        'active'  => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(AnalyticalAccount::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(AnalyticalAccount::class, 'parent_id')->orderBy('code');
    }

    public function moveLines(): HasMany
    {
        return $this->hasMany(MoveLine::class, 'analytical_account_id');
    }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------

    public function balance(): float
    {
        $debit  = $this->moveLines()->whereHas('move', fn ($q) => $q->where('state', 'posted'))->sum('debit');
        $credit = $this->moveLines()->whereHas('move', fn ($q) => $q->where('state', 'posted'))->sum('credit');

        return (float) $debit - (float) $credit;
    }

    public function debitBalance(): float
    {
        return (float) $this->moveLines()->whereHas('move', fn ($q) => $q->where('state', 'posted'))->sum('debit');
    }

    public function creditBalance(): float
    {
        return (float) $this->moveLines()->whereHas('move', fn ($q) => $q->where('state', 'posted'))->sum('credit');
    }
}
