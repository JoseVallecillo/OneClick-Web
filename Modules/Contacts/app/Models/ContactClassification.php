<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactClassification extends Model
{
    protected $fillable = [
        'contact_id',
        'type',
        'classification',
        'rating',
        'notes',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
