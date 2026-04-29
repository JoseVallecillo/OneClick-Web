<?php

namespace Modules\Purchases\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Contacts\Models\Contact;
use Modules\Inventory\Models\StockMove;
use Modules\Inventory\Models\Warehouse;
use Modules\Settings\Models\Currency;

class PurchaseOrder extends Model
{
    protected $fillable = [
        'reference',
        'supplier_id',
        'warehouse_id',
        'currency_id',
        'status',
        'expected_date',
        'confirmed_at',
        'received_at',
        'invoiced_at',
        'invoice_number',
        'invoice_date',
        'invoice_due_date',
        'subtotal',
        'tax_amount',
        'total',
        'stock_move_id',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'expected_date'   => 'date',
        'confirmed_at'    => 'datetime',
        'received_at'     => 'datetime',
        'invoiced_at'     => 'datetime',
        'invoice_date'    => 'date',
        'invoice_due_date' => 'date',
        'subtotal'        => 'decimal:4',
        'tax_amount'      => 'decimal:4',
        'total'           => 'decimal:4',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'supplier_id');
    }

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

    public function stockMove(): BelongsTo
    {
        return $this->belongsTo(StockMove::class, 'stock_move_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PurchaseOrderLine::class, 'purchase_order_id')->orderBy('id');
    }

    // -------------------------------------------------------------------------
    // Status helpers
    // -------------------------------------------------------------------------

    public function isDraft(): bool     { return $this->status === 'draft';     }
    public function isConfirmed(): bool { return $this->status === 'confirmed'; }
    public function isReceived(): bool  { return $this->status === 'received';  }
    public function isInvoiced(): bool  { return $this->status === 'invoiced';  }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------

    /**
     * Generate the next sequential reference in the format OC-YYYY-NNNN.
     */
    public static function generateReference(): string
    {
        $year   = now()->year;
        $prefix = "OC-{$year}-";

        $last = static::where('reference', 'like', $prefix . '%')
            ->orderByDesc('reference')
            ->value('reference');

        $next = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Recalculate and persist order-level totals from its lines.
     */
    public function recalculateTotals(): void
    {
        $this->lines()->each(fn ($line) => $line->recalculateTotals() && $line->save());

        $lines = $this->lines()->get();

        $this->subtotal   = $lines->sum('subtotal');
        $this->tax_amount = $lines->sum('tax_amount');
        $this->total      = $lines->sum('total');
        $this->save();
    }
}
