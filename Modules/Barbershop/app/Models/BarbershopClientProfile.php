<?php

namespace Modules\Barbershop\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Contacts\Models\Contact;

class BarbershopClientProfile extends Model
{
    protected $table = 'barbershop_client_profiles';

    protected $fillable = [
        'contact_id',
        'preferred_barber_id',
        'preferred_style',
        'total_visits',
        'total_spent',
        'last_visit_at',
    ];

    protected $casts = [
        'total_spent'   => 'decimal:2',
        'last_visit_at' => 'datetime',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'contact_id');
    }

    public function preferredBarber(): BelongsTo
    {
        return $this->belongsTo(Barber::class, 'preferred_barber_id');
    }

    public function refreshStats(): void
    {
        $completed = Appointment::where('client_id', $this->contact_id)
            ->where('status', 'completed');

        $this->total_visits  = $completed->count();
        $this->total_spent   = $completed->sum('total');
        $this->last_visit_at = $completed->max('completed_at');
        $this->save();
    }
}
