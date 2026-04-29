<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductAnalytics extends Model
{
    protected $table = 'inventory_product_analytics';

    protected $fillable = [
        'product_id',
        'total_sold_units',
        'total_sold_value',
        'average_monthly_sales',
        'average_monthly_profit',
        'stock_turnover_ratio',
        'days_inventory_outstanding',
        'abc_classification',
        'last_sold_at',
        'days_since_last_sale',
        'obsolescence_status',
    ];

    protected $casts = [
        'total_sold_units' => 'decimal:4',
        'total_sold_value' => 'decimal:2',
        'average_monthly_sales' => 'decimal:4',
        'average_monthly_profit' => 'decimal:2',
        'stock_turnover_ratio' => 'decimal:2',
        'last_sold_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function getAbcClassificationLabel(): string
    {
        return match($this->abc_classification) {
            'A' => 'Alto Valor',
            'B' => 'Valor Medio',
            'C' => 'Bajo Valor',
            default => 'No clasificado'
        };
    }
}
