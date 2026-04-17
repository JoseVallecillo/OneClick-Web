<?php

namespace Modules\CarService\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Inventory\Models\Product;

class ServicePackageItem extends Model
{
    protected $fillable = [
        'service_package_id',
        'product_id',
        'qty',
        'is_suggested',
        'suggestion_reason',
    ];

    protected $casts = [
        'qty'          => 'decimal:4',
        'is_suggested' => 'boolean',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function package(): BelongsTo
    {
        return $this->belongsTo(ServicePackage::class, 'service_package_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
