<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    protected $table = 'account_accounts';

    protected $fillable = [
        'code',
        'name',
        'description',
        'type',
        'normal_balance',
        'parent_id',
        'is_leaf',
        'tax_id',
        'active',
    ];

    protected $casts = [
        'is_leaf' => 'boolean',
        'active'  => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Account::class, 'parent_id')->orderBy('code');
    }

    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class, 'tax_id');
    }

    public function moveLines(): HasMany
    {
        return $this->hasMany(MoveLine::class, 'account_id');
    }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------

    public function isDebitNormal(): bool
    {
        return $this->normal_balance === 'debit';
    }

    public function balance(): float
    {
        $debit  = $this->moveLines()->whereHas('move', fn ($q) => $q->where('state', 'posted'))->sum('debit');
        $credit = $this->moveLines()->whereHas('move', fn ($q) => $q->where('state', 'posted'))->sum('credit');

        return $this->isDebitNormal()
            ? (float) $debit - (float) $credit
            : (float) $credit - (float) $debit;
    }

    public function typeLabel(): string
    {
        return match($this->type) {
            'asset'     => 'Activo',
            'liability' => 'Pasivo',
            'equity'    => 'Patrimonio',
            'income'    => 'Ingreso',
            'expense'   => 'Gasto',
            default     => $this->type,
        };
    }
}
