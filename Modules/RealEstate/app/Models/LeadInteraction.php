<?php

namespace Modules\RealEstate\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadInteraction extends Model
{
    protected $table = 're_lead_interactions';

    protected $fillable = [
        'lead_id', 'type', 'subject', 'notes', 'interaction_at', 'user_id',
    ];

    protected $casts = [
        'interaction_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(RealEstateLead::class, 'lead_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
