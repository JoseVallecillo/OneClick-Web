<?php

namespace Modules\AutoLote\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VehicleLoan extends Model
{
    protected $table = 'autolote_vehicle_loans';

    protected $fillable = [
        'sale_id',
        'monto_prestamo',
        'tasa_interes',
        'plazo_meses',
        'cuota_mensual',
        'fecha_inicio',
        'estado',
    ];

    protected $casts = [
        'monto_prestamo' => 'decimal:4',
        'tasa_interes'   => 'decimal:4',
        'cuota_mensual'  => 'decimal:4',
        'plazo_meses'    => 'integer',
        'fecha_inicio'   => 'date',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(VehicleSale::class, 'sale_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(LoanPayment::class, 'loan_id')->orderBy('numero_cuota');
    }

    /**
     * Generate amortization schedule and persist all payment rows.
     */
    public function generateSchedule(): void
    {
        $this->payments()->delete();

        $principal = (float) $this->monto_prestamo;
        $r         = (float) $this->tasa_interes / 100 / 12;
        $n         = $this->plazo_meses;

        $cuota = $r > 0
            ? $principal * ($r * pow(1 + $r, $n)) / (pow(1 + $r, $n) - 1)
            : $principal / $n;

        $saldo = $principal;

        for ($i = 1; $i <= $n; $i++) {
            $interes = round($saldo * $r, 4);
            $capital = round($cuota - $interes, 4);

            if ($i === $n) {
                $capital = $saldo;
            }

            $saldo = round($saldo - $capital, 4);

            LoanPayment::create([
                'loan_id'           => $this->id,
                'numero_cuota'      => $i,
                'fecha_vencimiento' => $this->fecha_inicio->copy()->addMonthsNoOverflow($i),
                'monto_cuota'       => round($capital + $interes, 4),
                'monto_capital'     => $capital,
                'monto_interes'     => $interes,
                'saldo_pendiente'   => max(0.0, $saldo),
                'pagado'            => false,
            ]);
        }

        $this->cuota_mensual = round($cuota, 4);
        $this->save();
    }
}
