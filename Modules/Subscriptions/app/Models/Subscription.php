<?php

namespace Modules\Subscriptions\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Settings\Models\Company;

class Subscription extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'company_id',
        'plan_id',
        'starts_at',
        'ends_at',
        'is_active',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at'   => 'datetime',
        'is_active' => 'boolean',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function daysRemaining(): int
    {
        $remaining = (int) now()->diffInDays($this->ends_at, false);

        return max(0, $remaining);
    }

    public function isValid(): bool
    {
        return $this->is_active && $this->ends_at->isFuture();
    }
}
