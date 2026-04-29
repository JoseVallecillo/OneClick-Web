<?php

namespace Modules\Inventory\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class StockMove extends Model
{
    protected $fillable = [
        'type',
        'status',
        'warehouse_id',
        'dest_warehouse_id',
        'reference',
        'notes',
        'related_move_id',
        'accounting_pending',
        'created_by',
        'moved_at',
        'confirmed_at',
    ];

    protected $casts = [
        'accounting_pending' => 'boolean',
        'moved_at'           => 'datetime',
        'confirmed_at'       => 'datetime',
    ];

    // -------------------------------------------------------------------------
    // Computed attributes
    // -------------------------------------------------------------------------

    /**
     * Total cost of all lines (not stored in DB — calculated from related lines).
     */
    public function getTotalCostAttribute(): float
    {
        return (float) $this->lines->sum('total_cost');
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }

    public function destWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'dest_warehouse_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function relatedMove(): BelongsTo
    {
        return $this->belongsTo(StockMove::class, 'related_move_id');
    }

    public function lines(): HasMany
    {
        return $this->hasMany(StockMoveLine::class, 'stock_move_id');
    }

    // -------------------------------------------------------------------------
    // Business logic
    // -------------------------------------------------------------------------

    /**
     * Process all stock move lines: update stock quantities and lot quantities,
     * then recalculate average cost when applicable.
     *
     * Must be called inside an existing DB::transaction() or will wrap its own.
     */
    public function process(): void
    {
        if ($this->status === 'confirmed' && $this->confirmed_at !== null) {
            return; // Already processed
        }

        DB::transaction(function () {
            // Reload lines with products to avoid N+1 inside the loop
            $lines = $this->lines()->with('product')->get();

            foreach ($lines as $line) {
                $product    = $line->product;
                $warehouseId = $this->warehouse_id;

                // -----------------------------------------------------------------
                // 1. Determine the signed quantity delta
                // -----------------------------------------------------------------
                $signedQty = match ($this->type) {
                    'in', 'initial', 'transfer_in' => (float) $line->qty,
                    'out', 'transfer_out'           => -(float) $line->qty,
                    // For 'adjust', qty itself can be negative — pass through directly
                    'adjust'                        => (float) $line->qty,
                    default                         => (float) $line->qty,
                };

                // -----------------------------------------------------------------
                // 2. Upsert stock_quantities
                // -----------------------------------------------------------------
                $existing = DB::table('stock_quantities')
                    ->where('product_id', $line->product_id)
                    ->where('warehouse_id', $warehouseId)
                    ->first();

                if ($existing) {
                    DB::table('stock_quantities')
                        ->where('product_id', $line->product_id)
                        ->where('warehouse_id', $warehouseId)
                        ->update([
                            'quantity'   => DB::raw("quantity + {$signedQty}"),
                            'updated_at' => now(),
                        ]);
                } else {
                    DB::table('stock_quantities')->insert([
                        'product_id'   => $line->product_id,
                        'warehouse_id' => $warehouseId,
                        'quantity'     => $signedQty,
                        'updated_at'   => now(),
                    ]);
                }

                // -----------------------------------------------------------------
                // 3. Update lot qty_available if a lot is assigned
                // -----------------------------------------------------------------
                if ($line->lot_id !== null) {
                    DB::table('stock_lots')
                        ->where('id', $line->lot_id)
                        ->update([
                            'qty_available' => DB::raw("qty_available + {$signedQty}"),
                            'updated_at'    => now(),
                        ]);
                }

                // -----------------------------------------------------------------
                // 4. Recalculate average cost on inbound movements
                // -----------------------------------------------------------------
                $isIncoming = in_array($this->type, ['in', 'initial', 'transfer_in'])
                    || ($this->type === 'adjust' && $signedQty > 0);

                if ($product->valuation === 'average' && $isIncoming) {
                    $product->recalculateAverageCost($warehouseId);
                }
            }

            // -----------------------------------------------------------------
            // 5. Update Status and mark entries
            // -----------------------------------------------------------------
            $this->status = 'confirmed';
            $this->confirmed_at = now();
            $this->accounting_pending = true;
            $this->saveQuietly();
        });
    }
}
