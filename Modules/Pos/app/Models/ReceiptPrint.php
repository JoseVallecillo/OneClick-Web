<?php

namespace Modules\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReceiptPrint extends Model
{
    protected $table = 'pos_receipt_prints';

    protected $fillable = [
        'pos_sale_id',
        'printer_type',
        'printer_name',
        'printed_at',
        'reprint_count',
        'printed_by',
    ];

    protected $casts = [
        'printed_at' => 'datetime',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(PosSale::class, 'pos_sale_id');
    }

    public function printedByUser(): BelongsTo
    {
        return $this->belongsTo('App\Models\User', 'printed_by');
    }

    public function incrementReprint(): void
    {
        $this->increment('reprint_count');
    }
}
