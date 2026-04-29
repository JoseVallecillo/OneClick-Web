<?php

namespace Modules\Hospitality\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Folio extends Model
{
    protected $table = 'hospitality_folios';

    const ISV_RATE         = 0.15; // Honduras ISV
    const TOURISM_TAX_RATE = 0.04; // Honduras Tourism Tax

    protected $fillable = [
        'reservation_id', 'subtotal', 'isv_amount',
        'tourism_tax_amount', 'total_amount', 'payment_status',
    ];

    protected $casts = [
        'subtotal'           => 'decimal:2',
        'isv_amount'         => 'decimal:2',
        'tourism_tax_amount' => 'decimal:2',
        'total_amount'       => 'decimal:2',
    ];

    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class, 'reservation_id');
    }

    public function calculateFromSubtotal(float $subtotal): void
    {
        $this->subtotal           = round($subtotal, 2);
        $this->isv_amount         = round($subtotal * self::ISV_RATE, 2);
        $this->tourism_tax_amount = round($subtotal * self::TOURISM_TAX_RATE, 2);
        $this->total_amount       = round($subtotal + $this->isv_amount + $this->tourism_tax_amount, 2);
    }

    public function effectiveTaxRate(): float
    {
        return self::ISV_RATE + self::TOURISM_TAX_RATE;
    }
}
