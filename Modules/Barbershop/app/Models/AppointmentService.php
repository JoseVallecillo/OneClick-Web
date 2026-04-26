<?php

namespace Modules\Barbershop\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\Product;

class AppointmentService extends Model
{
    protected $table = 'barbershop_appointment_services';

    protected $fillable = [
        'appointment_id',
        'service_id',
        'service_name',
        'duration_minutes',
        'price',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'service_id');
    }
}
