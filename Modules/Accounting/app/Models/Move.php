<?php

namespace Modules\Accounting\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Move extends Model
{
    protected $table = 'account_moves';

    protected $fillable = [
        'reference',
        'journal_id',
        'date',
        'narration',
        'state',
        'reverse_of_id',
        'source_document_type',
        'source_document_id',
        'created_by',
        'posted_by',
        'posted_at',
    ];

    protected $casts = [
        'date'      => 'date',
        'posted_at' => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function journal(): BelongsTo
    {
        return $this->belongsTo(Journal::class, 'journal_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(MoveLine::class, 'move_id')->orderBy('id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function poster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function reverseOf(): BelongsTo
    {
        return $this->belongsTo(Move::class, 'reverse_of_id');
    }

    // -------------------------------------------------------------------------
    // State helpers
    // -------------------------------------------------------------------------

    public function isDraft(): bool     { return $this->state === 'draft';     }
    public function isPosted(): bool    { return $this->state === 'posted';    }
    public function isCancelled(): bool { return $this->state === 'cancelled'; }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------

    public static function generateReference(Journal $journal): string
    {
        $year   = now()->year;
        $prefix = strtoupper($journal->code) . "-{$year}-";

        $last = static::where('reference', 'like', $prefix . '%')
            ->orderByDesc('reference')
            ->value('reference');

        $next = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Validate the double-entry constraint: sum(debit) must equal sum(credit).
     */
    public function validateDoubleEntry(): bool
    {
        $totals = $this->lines()->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')->first();

        return abs((float) $totals->total_debit - (float) $totals->total_credit) < 0.0001;
    }

    /**
     * Post the entry. Throws if double-entry constraint fails.
     * A posted entry is immutable — edits require a reversal entry.
     */
    public function post(int $userId): void
    {
        if (! $this->isDraft()) {
            throw new \LogicException("Solo los asientos en borrador pueden publicarse.");
        }

        if (! $this->validateDoubleEntry()) {
            $totals = $this->lines()->selectRaw('SUM(debit) as d, SUM(credit) as c')->first();
            throw new \LogicException(
                "Partida doble no balanceada: Debe {$totals->d} ≠ Haber {$totals->c}."
            );
        }

        $this->update([
            'state'     => 'posted',
            'posted_by' => $userId,
            'posted_at' => now(),
        ]);
    }

    /**
     * Create a reversal entry (contra-entry) to cancel a posted move.
     * The original move is marked 'cancelled'; the reversal is posted immediately.
     */
    public function reverse(int $userId, ?string $narration = null): self
    {
        if (! $this->isPosted()) {
            throw new \LogicException("Solo los asientos publicados pueden revertirse.");
        }

        return DB::transaction(function () use ($userId, $narration) {
            $reversal = static::create([
                'reference'    => static::generateReference($this->journal),
                'journal_id'   => $this->journal_id,
                'date'         => now()->toDateString(),
                'narration'    => $narration ?? "Reversión de {$this->reference}",
                'state'        => 'draft',
                'reverse_of_id' => $this->id,
                'created_by'   => $userId,
            ]);

            foreach ($this->lines as $line) {
                MoveLine::create([
                    'move_id'    => $reversal->id,
                    'account_id' => $line->account_id,
                    'partner_id' => $line->partner_id,
                    'tax_id'     => $line->tax_id,
                    'name'       => "Rev: {$line->name}",
                    'debit'      => $line->credit,  // swap debit ↔ credit
                    'credit'     => $line->debit,
                    'currency_id'       => $line->currency_id,
                    'amount_currency'   => $line->amount_currency ? -$line->amount_currency : null,
                ]);
            }

            $reversal->post($userId);

            $this->update(['state' => 'cancelled']);

            return $reversal;
        });
    }
}
