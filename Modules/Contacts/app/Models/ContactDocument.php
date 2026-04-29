<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactDocument extends Model
{
    protected $fillable = [
        'contact_id',
        'document_type',
        'document_name',
        'file_path',
        'file_type',
        'file_size',
        'document_date',
        'expiry_date',
        'status',
        'notes',
        'uploaded_by',
    ];

    protected $casts = [
        'document_date' => 'datetime',
        'expiry_date' => 'datetime',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo('App\Models\User', 'uploaded_by');
    }

    public function isExpired(): bool
    {
        return $this->expiry_date && $this->expiry_date->isPast();
    }
}
