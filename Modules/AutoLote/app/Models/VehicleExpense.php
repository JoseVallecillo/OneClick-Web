<?php

namespace Modules\AutoLote\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleExpense extends Model
{
    protected $table = 'autolote_vehicle_expenses';

    protected $fillable = [
        'vehicle_id',
        'tipo',
        'descripcion',
        'monto',
        'fecha',
    ];

    protected $casts = [
        'monto' => 'decimal:4',
        'fecha' => 'date',
    ];

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }
}
