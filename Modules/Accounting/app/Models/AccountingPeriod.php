<?php

namespace Modules\Accounting\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountingPeriod extends Model
{
    protected $table = 'account_periods';

    protected $fillable = [
        'name',
        'date_from',
        'date_to',
        'state',
        'closing_notes',
        'closed_at',
        'closed_by',
        'is_current',
    ];

    protected $casts = [
        'date_from' => 'date',
        'date_to'   => 'date',
        'closed_at' => 'datetime',
        'is_current' => 'boolean',
    ];

    public function closedByUser(): BelongsTo
    {
        return $this->belongsTo('App\Models\User', 'closed_by');
    }

    public function isClosed(): bool
    {
        return $this->state === 'closed';
    }

    public function isLocked(): bool
    {
        return $this->state === 'locked';
    }
}
