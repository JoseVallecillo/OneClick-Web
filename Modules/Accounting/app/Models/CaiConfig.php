<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CaiConfig extends Model
{
    protected $table = 'account_cai_configs';

    protected $fillable = [
        'cai',
        'range_from',
        'range_to',
        'current_number',
        'expires_at',
        'journal_id',
        'establishment_code',
        'terminal_code',
        'active',
    ];

    protected $casts = [
        'expires_at' => 'date',
        'active'     => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function journal(): BelongsTo
    {
        return $this->belongsTo(Journal::class, 'journal_id');
    }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isRangeExhausted(): bool
    {
        return $this->current_number !== null && $this->current_number >= $this->range_to;
    }

    public function isValid(): bool
    {
        return $this->active && ! $this->isExpired() && ! $this->isRangeExhausted();
    }

    /**
     * Advance the consecutive number and return it.
     * Throws if the CAI is expired or the range is exhausted.
     */
    public function nextNumber(): string
    {
        if (! $this->isValid()) {
            throw new \RuntimeException("El CAI {$this->cai} no está vigente o su rango está agotado.");
        }

        $next = $this->current_number === null
            ? $this->range_from
            : str_pad((int) $this->current_number + 1, strlen($this->range_from), '0', STR_PAD_LEFT);

        $this->update(['current_number' => $next]);

        return $next;
    }
}
