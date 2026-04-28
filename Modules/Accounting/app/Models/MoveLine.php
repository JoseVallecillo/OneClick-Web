<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Contacts\Models\Contact;
use Modules\Settings\Models\Currency;

class MoveLine extends Model
{
    protected $table = 'account_move_lines';

    protected $fillable = [
        'move_id',
        'account_id',
        'analytical_account_id',
        'partner_id',
        'tax_id',
        'name',
        'debit',
        'credit',
        'currency_id',
        'amount_currency',
        'reconciled',
        'due_date',
    ];

    protected $casts = [
        'debit'           => 'decimal:4',
        'credit'          => 'decimal:4',
        'amount_currency' => 'decimal:4',
        'reconciled'      => 'boolean',
        'due_date'        => 'date',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function move(): BelongsTo
    {
        return $this->belongsTo(Move::class, 'move_id');
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'account_id');
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'partner_id');
    }

    public function tax(): BelongsTo
    {
        return $this->belongsTo(Tax::class, 'tax_id');
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_id');
    }

    public function analyticalAccount(): BelongsTo
    {
        return $this->belongsTo(AnalyticalAccount::class, 'analytical_account_id');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function balance(): float
    {
        return (float) $this->debit - (float) $this->credit;
    }
}
