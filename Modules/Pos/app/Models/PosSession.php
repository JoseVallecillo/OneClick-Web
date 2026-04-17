<?php

namespace Modules\Pos\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Inventory\Models\Warehouse;
use Modules\Settings\Models\Currency;

class PosSession extends Model
{
    protected $fillable = [
        'reference',
        'name',
        'warehouse_id',
        'currency_id',
        'status',
        'opening_balance',
        'closing_balance',
        'total_sales',
        'total_cash',
        'total_card',
        'total_transfer',
        'sales_count',
        'voided_count',
        'opened_at',
        'closed_at',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:4',
        'closing_balance' => 'decimal:4',
        'total_sales'     => 'decimal:4',
        'total_cash'      => 'decimal:4',
        'total_card'      => 'decimal:4',
        'total_transfer'  => 'decimal:4',
        'sales_count'     => 'integer',
        'voided_count'    => 'integer',
        'opened_at'       => 'datetime',
        'closed_at'       => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function sales(): HasMany
    {
        return $this->hasMany(PosSale::class, 'pos_session_id')->orderByDesc('id');
    }

    // -------------------------------------------------------------------------
    // Status helpers
    // -------------------------------------------------------------------------

    public function isOpen(): bool   { return $this->status === 'open';   }
    public function isClosed(): bool { return $this->status === 'closed'; }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------

    /**
     * Generate the next sequential reference in the format TP-YYYY-NNNN.
     */
    public static function generateReference(): string
    {
        $year   = now()->year;
        $prefix = "TP-{$year}-";

        $last = static::where('reference', 'like', $prefix . '%')
            ->orderByDesc('reference')
            ->value('reference');

        $next = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Recompute running totals from completed sales.
     * Called after each sale or void.
     */
    public function recalculateTotals(): void
    {
        $completed = $this->sales()->where('status', 'completed');

        $this->total_sales    = $completed->sum('total');
        $this->total_cash     = $completed->where('payment_method', 'cash')->sum('total');
        $this->total_card     = $completed->where('payment_method', 'card')->sum('total');
        $this->total_transfer = $completed->where('payment_method', 'transfer')->sum('total');
        $this->sales_count    = $completed->count();
        $this->voided_count   = $this->sales()->where('status', 'voided')->count();
        $this->save();
    }

    /**
     * Expected cash in drawer = opening balance + cash sales.
     */
    public function expectedCash(): float
    {
        return (float) $this->opening_balance + (float) $this->total_cash;
    }
}
