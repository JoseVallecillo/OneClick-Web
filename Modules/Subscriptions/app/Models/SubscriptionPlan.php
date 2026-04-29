<?php

namespace Modules\Subscriptions\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    protected $fillable = ['name', 'user_limit', 'duration_days', 'active'];

    protected $casts = [
        'user_limit'    => 'integer',
        'duration_days' => 'integer',
        'active'        => 'boolean',
    ];

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }

    public function licenseTokens(): HasMany
    {
        return $this->hasMany(LicenseToken::class, 'plan_id');
    }

    /** Indica si el plan permite usuarios ilimitados. */
    public function isUnlimited(): bool
    {
        return $this->user_limit === null;
    }
}
