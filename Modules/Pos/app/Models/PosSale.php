<?php

namespace Modules\Pos\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Contacts\Models\Contact;
use Modules\Inventory\Models\StockMove;
use Modules\Settings\Models\Currency;

class PosSale extends Model
{
    protected $fillable = [
        'reference',
        'pos_session_id',
        'customer_id',
        'currency_id',
        'status',
        'payment_method',
        'amount_tendered',
        'change_given',
        'subtotal',
        'tax_amount',
        'total',
        'stock_move_id',
        'notes',
        'voided_at',
        'voided_by',
        'created_by',
    ];

    protected $casts = [
        'amount_tendered' => 'decimal:4',
        'change_given'    => 'decimal:4',
        'subtotal'        => 'decimal:4',
        'tax_amount'      => 'decimal:4',
        'total'           => 'decimal:4',
        'voided_at'       => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function session(): BelongsTo
    {
        return $this->belongsTo(PosSession::class, 'pos_session_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'customer_id');
    }

    public function currency(): BelongsTo
    {
        return $this->belongsTo(Currency::class, 'currency_id');
    }

    public function stockMove(): BelongsTo
    {
        return $this->belongsTo(StockMove::class, 'stock_move_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(PosSaleLine::class, 'pos_sale_id')->orderBy('id');
    }

    // -------------------------------------------------------------------------
    // Status helpers
    // -------------------------------------------------------------------------

    public function isCompleted(): bool { return $this->status === 'completed'; }
    public function isVoided(): bool    { return $this->status === 'voided';    }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------

    /**
     * Generate the next sequential reference in the format RV-YYYY-NNNN.
     */
    public static function generateReference(): string
    {
        $year   = now()->year;
        $prefix = "RV-{$year}-";

        $last = static::where('reference', 'like', $prefix . '%')
            ->orderByDesc('reference')
            ->value('reference');

        $next = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }
}
