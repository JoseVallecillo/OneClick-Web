<?php

namespace Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductRecipeLine extends Model
{
    protected $table = 'product_recipe_lines';

    protected $fillable = ['product_id', 'ingredient_id', 'qty'];

    protected $casts = ['qty' => 'decimal:4'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'ingredient_id');
    }
}
