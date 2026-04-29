<?php

namespace Modules\Hospitality\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Modules\Contacts\Models\Contact;

class Reservation extends Model
{
    protected $table = 'hospitality_reservations';

    protected $fillable = [
        'partner_id', 'room_id', 'check_in_date', 'check_out_date',
        'status', 'notes', 'created_by',
    ];

    protected $casts = [
        'check_in_date'  => 'date',
        'check_out_date' => 'date',
    ];

    public function partner(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'partner_id');
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class, 'room_id');
    }

    public function folio(): HasOne
    {
        return $this->hasOne(Folio::class, 'reservation_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function nights(): int
    {
        return $this->check_in_date->diffInDays($this->check_out_date);
    }

    public function isDraft(): bool     { return $this->status === 'draft'; }
    public function isConfirmed(): bool { return $this->status === 'confirmed'; }
    public function isCheckedIn(): bool { return $this->status === 'checked_in'; }
    public function isEditable(): bool  { return in_array($this->status, ['draft', 'confirmed']); }
}
