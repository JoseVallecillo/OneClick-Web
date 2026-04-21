<?php

namespace Modules\AutoLote\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Modules\Contacts\Models\Contact;

class VehicleSale extends Model
{
    protected $table = 'autolote_vehicle_sales';

    protected $fillable = [
        'vehicle_id',
        'buyer_id',
        'precio_venta',
        'descuento',
        'tipo_pago',
        'vehicle_permuta_id',
        'valor_permuta',
        'fecha_venta',
        'notas',
    ];

    protected $casts = [
        'precio_venta'  => 'decimal:4',
        'descuento'     => 'decimal:4',
        'valor_permuta' => 'decimal:4',
        'fecha_venta'   => 'date',
    ];

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id');
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'buyer_id');
    }

    public function vehiclePermuta(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_permuta_id');
    }

    public function loan(): HasOne
    {
        return $this->hasOne(VehicleLoan::class, 'sale_id');
    }

    public function getNetPriceAttribute(): float
    {
        return (float) $this->precio_venta - (float) $this->descuento - (float) $this->valor_permuta;
    }
}
