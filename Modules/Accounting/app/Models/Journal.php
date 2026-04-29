<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Journal extends Model
{
    protected $table = 'account_journals';

    protected $fillable = [
        'name',
        'code',
        'type',
        'default_debit_account_id',
        'default_credit_account_id',
        'bank_account_number',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function defaultDebitAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'default_debit_account_id');
    }

    public function defaultCreditAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'default_credit_account_id');
    }

    public function moves(): HasMany
    {
        return $this->hasMany(Move::class, 'journal_id');
    }

    public function caiConfigs(): HasMany
    {
        return $this->hasMany(CaiConfig::class, 'journal_id');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function typeLabel(): string
    {
        return match($this->type) {
            'sales'     => 'Ventas',
            'purchases' => 'Compras',
            'bank'      => 'Banco',
            'cash'      => 'Caja',
            'general'   => 'Varios',
            default     => $this->type,
        };
    }

    public function activeCai(): ?CaiConfig
    {
        return $this->caiConfigs()
            ->where('active', true)
            ->where('expires_at', '>=', now()->toDateString())
            ->latest()
            ->first();
    }
}
