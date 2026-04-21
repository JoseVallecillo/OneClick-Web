<?php

namespace Modules\AutoLote\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Modules\Contacts\Models\Contact;

class Vehicle extends Model
{
    protected $table = 'autolote_vehicles';

    protected $fillable = [
        'vin',
        'placa',
        'motor',
        'marca',
        'modelo',
        'anio',
        'color',
        'transmision',
        'kilometraje',
        'num_duenos_anteriores',
        'gravamen',
        'estado_aduana',
        'estado',
        'precio_compra',
        'costo_total',
        'vendedor_id',
        'notas',
        'received_at',
    ];

    protected $casts = [
        'anio'                  => 'integer',
        'kilometraje'           => 'integer',
        'num_duenos_anteriores' => 'integer',
        'gravamen'              => 'boolean',
        'precio_compra'         => 'decimal:4',
        'costo_total'           => 'decimal:4',
        'received_at'           => 'date',
    ];

    public function vendedor(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'vendedor_id');
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(VehicleExpense::class, 'vehicle_id')->orderBy('fecha');
    }

    public function sale(): HasOne
    {
        return $this->hasOne(VehicleSale::class, 'vehicle_id');
    }

    public function recalculateCosto(): void
    {
        $totalExpenses = (float) $this->expenses()->sum('monto');
        $this->costo_total = round((float) $this->precio_compra + $totalExpenses, 4);
        $this->save();
    }

    public function isRecepcion(): bool   { return $this->estado === 'recepcion';   }
    public function isPreparacion(): bool { return $this->estado === 'preparacion'; }
    public function isExhibicion(): bool  { return $this->estado === 'exhibicion';  }
    public function isApartado(): bool    { return $this->estado === 'apartado';    }
    public function isVendido(): bool     { return $this->estado === 'vendido';     }

    public function getDisplayNameAttribute(): string
    {
        return "{$this->marca} {$this->modelo} {$this->anio}" . ($this->placa ? " ({$this->placa})" : '');
    }
}
