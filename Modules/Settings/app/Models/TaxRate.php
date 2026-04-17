<?php

namespace Modules\Settings\Models;

use Illuminate\Database\Eloquent\Model;

class TaxRate extends Model
{
    protected $fillable = [
        'name',
        'rate',
        'is_default',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'rate'       => 'decimal:2',
            'is_default' => 'boolean',
            'active'     => 'boolean',
        ];
    }

    /**
     * Marca esta tasa como predeterminada y quita el flag de las demás.
     */
    public function setDefault(): void
    {
        static::where('id', '!=', $this->id)->update(['is_default' => false]);
        $this->update(['is_default' => true]);
    }
}
