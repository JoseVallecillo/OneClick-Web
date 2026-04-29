<?php

namespace Modules\Contacts\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactsAuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id', 'entity_type', 'entity_id', 'action',
        'old_values', 'new_values', 'reason', 'ip_address', 'created_at',
    ];

    protected $casts = [
        'old_values' => 'json',
        'new_values' => 'json',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
