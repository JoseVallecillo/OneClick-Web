<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactCommunication extends Model
{
    protected $fillable = [
        'contact_id',
        'user_id',
        'type',
        'subject',
        'content',
        'communication_date',
        'outcome',
        'follow_up_date',
        'follow_up_type',
    ];

    protected $casts = [
        'communication_date' => 'datetime',
        'follow_up_date' => 'datetime',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo('App\Models\User');
    }
}
