<?php

namespace Modules\RealEstate\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Contacts\Models\Contact;

class SupportTicket extends Model
{
    protected $table = 're_support_tickets';

    protected $fillable = [
        'reference', 'deal_id', 'property_id', 'contact_id', 'type',
        'title', 'description', 'priority', 'status',
        'assigned_to', 'resolution_notes', 'resolved_at', 'created_by',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function deal(): BelongsTo
    {
        return $this->belongsTo(RealEstateDeal::class, 'deal_id');
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function generateReference(): string
    {
        $year   = now()->year;
        $prefix = "ST-{$year}-";
        $last   = static::where('reference', 'like', $prefix . '%')->orderByDesc('reference')->value('reference');
        $next   = $last ? ((int) substr($last, -4)) + 1 : 1;
        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }
}
