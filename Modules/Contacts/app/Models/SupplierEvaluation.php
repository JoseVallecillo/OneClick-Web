<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierEvaluation extends Model
{
    protected $fillable = [
        'contact_id',
        'quality_rating',
        'delivery_rating',
        'communication_rating',
        'price_rating',
        'on_time_delivery_percent',
        'defect_rate',
        'average_delivery_days',
        'last_evaluation_date',
        'notes',
    ];

    protected $casts = [
        'last_evaluation_date' => 'datetime',
        'on_time_delivery_percent' => 'decimal:2',
        'defect_rate' => 'decimal:2',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function overallRating(): float
    {
        return ($this->quality_rating + $this->delivery_rating + $this->communication_rating + $this->price_rating) / 4;
    }
}
