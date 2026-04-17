<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class ContactAddress extends Model
{
    protected $fillable = [
        'contact_id',
        'type',
        'label',
        'address_line',
        'city',
        'state',
        'country',
        'postal_code',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /**
     * Marca esta dirección como predeterminada para su tipo dentro del mismo contacto.
     */
    public function setDefault(): void
    {
        DB::transaction(function () {
            static::where('contact_id', $this->contact_id)
                ->where('type', $this->type)
                ->where('id', '!=', $this->id)
                ->update(['is_default' => false]);

            $this->update(['is_default' => true]);
        });
    }
}
