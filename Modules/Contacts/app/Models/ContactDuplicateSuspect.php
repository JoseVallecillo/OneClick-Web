<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactDuplicateSuspect extends Model
{
    protected $table = 'contact_duplicate_suspects';

    protected $fillable = [
        'contact_id_1',
        'contact_id_2',
        'similarity_score',
        'match_fields',
        'status',
        'merged_into_id',
        'reviewed_at',
        'reviewed_by',
    ];

    protected $casts = [
        'similarity_score' => 'decimal:2',
        'reviewed_at' => 'datetime',
    ];

    public function contact1(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'contact_id_1');
    }

    public function contact2(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'contact_id_2');
    }

    public function mergedInto(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'merged_into_id');
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo('App\Models\User', 'reviewed_by');
    }
}
