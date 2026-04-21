<?php

namespace Modules\AutoLote\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoanPayment extends Model
{
    protected $table = 'autolote_loan_payments';

    protected $fillable = [
        'loan_id',
        'numero_cuota',
        'fecha_vencimiento',
        'fecha_pago',
        'monto_cuota',
        'monto_capital',
        'monto_interes',
        'saldo_pendiente',
        'pagado',
    ];

    protected $casts = [
        'monto_cuota'       => 'decimal:4',
        'monto_capital'     => 'decimal:4',
        'monto_interes'     => 'decimal:4',
        'saldo_pendiente'   => 'decimal:4',
        'fecha_vencimiento' => 'date',
        'fecha_pago'        => 'date',
        'pagado'            => 'boolean',
        'numero_cuota'      => 'integer',
    ];

    public function loan(): BelongsTo
    {
        return $this->belongsTo(VehicleLoan::class, 'loan_id');
    }
}
