<?php

namespace Modules\Settings\Models;

use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    protected $fillable = [
        'code',
        'name',
        'symbol',
        'exchange_rate',
        'is_primary',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'exchange_rate' => 'decimal:6',
            'is_primary'    => 'boolean',
            'active'        => 'boolean',
        ];
    }

    /**
     * Marca esta moneda como principal y quita el flag de las demás.
     */
    public function setPrimary(): void
    {
        static::where('id', '!=', $this->id)->update(['is_primary' => false]);
        $this->update(['is_primary' => true, 'exchange_rate' => 1]);
    }
}
