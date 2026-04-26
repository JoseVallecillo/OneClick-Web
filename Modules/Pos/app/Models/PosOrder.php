<?php

namespace Modules\Pos\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosOrder extends Model
{
    protected $fillable = [
        'reference',
        'pos_session_id',
        'pos_table_id',
        'pos_waiter_id',
        'status',
        'notes',
        'subtotal',
        'tax_amount',
        'total',
        'opened_at',
        'billed_at',
        'pos_sale_id',
        'created_by',
    ];

    protected $casts = [
        'subtotal'   => 'decimal:4',
        'tax_amount' => 'decimal:4',
        'total'      => 'decimal:4',
        'opened_at'  => 'datetime',
        'billed_at'  => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function session(): BelongsTo
    {
        return $this->belongsTo(PosSession::class, 'pos_session_id');
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(PosTable::class, 'pos_table_id');
    }

    public function waiter(): BelongsTo
    {
        return $this->belongsTo(PosWaiter::class, 'pos_waiter_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PosOrderLine::class, 'pos_order_id')->orderBy('id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(PosSale::class, 'pos_sale_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // -------------------------------------------------------------------------
    // Status helpers
    // -------------------------------------------------------------------------

    public function isOpen(): bool      { return $this->status === 'open';      }
    public function isBilled(): bool    { return $this->status === 'billed';    }
    public function isCancelled(): bool { return $this->status === 'cancelled'; }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------

    public static function generateReference(): string
    {
        $year   = now()->year;
        $prefix = "OD-{$year}-";

        $last = static::where('reference', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderByRaw('CAST(SUBSTRING(reference, ?) AS UNSIGNED) DESC', [strlen($prefix) + 1])
            ->value('reference');

        $next = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    public function recalculateTotals(): void
    {
        $this->loadMissing('lines');

        $this->subtotal   = round($this->lines->sum(fn ($l) => (float) $l->subtotal), 4);
        $this->tax_amount = round($this->lines->sum(fn ($l) => (float) $l->tax_amount), 4);
        $this->total      = round($this->lines->sum(fn ($l) => (float) $l->total), 4);
        $this->save();

        // Keep pos_tables.total in sync
        if ($this->pos_table_id) {
            PosTable::where('id', $this->pos_table_id)->update(['total' => $this->total]);
        }
    }
}
