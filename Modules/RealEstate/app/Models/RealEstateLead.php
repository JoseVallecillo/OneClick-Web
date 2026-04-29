<?php

namespace Modules\RealEstate\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Contacts\Models\Contact;

class RealEstateLead extends Model
{
    protected $table = 're_leads';

    protected $fillable = [
        'reference', 'contact_id', 'name', 'phone', 'email',
        'deal_type', 'property_type', 'budget_min', 'budget_max',
        'preferred_zone', 'bedrooms_min', 'bathrooms_min',
        'status', 'source', 'notes',
        'agent_id', 'created_by', 'assigned_at', 'closed_at',
    ];

    protected $casts = [
        'budget_min'  => 'decimal:4',
        'budget_max'  => 'decimal:4',
        'assigned_at' => 'datetime',
        'closed_at'   => 'datetime',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function interactions(): HasMany
    {
        return $this->hasMany(LeadInteraction::class, 'lead_id')->orderByDesc('interaction_at');
    }

    public function deals(): HasMany
    {
        return $this->hasMany(RealEstateDeal::class, 'lead_id');
    }

    public static function generateReference(): string
    {
        $year   = now()->year;
        $prefix = "LD-{$year}-";
        $last   = static::where('reference', 'like', $prefix . '%')->orderByDesc('reference')->value('reference');
        $next   = $last ? ((int) substr($last, -4)) + 1 : 1;
        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    public function matchingProperties()
    {
        $query = Property::where('status', 'available');

        if ($this->deal_type !== 'both') {
            if ($this->deal_type === 'sale') {
                $query->whereNotNull('sale_price');
            } else {
                $query->whereNotNull('rent_price');
            }
        }

        if ($this->property_type !== 'any') {
            $query->where('type', $this->property_type);
        }

        if ($this->budget_max) {
            $priceField = $this->deal_type === 'rent' ? 'rent_price' : 'sale_price';
            $query->where($priceField, '<=', $this->budget_max);
        }

        if ($this->budget_min) {
            $priceField = $this->deal_type === 'rent' ? 'rent_price' : 'sale_price';
            $query->where($priceField, '>=', $this->budget_min);
        }

        if ($this->preferred_zone) {
            $query->where(function ($q) {
                $q->where('zone', 'ilike', "%{$this->preferred_zone}%")
                  ->orWhere('city', 'ilike', "%{$this->preferred_zone}%");
            });
        }

        if ($this->bedrooms_min > 0) {
            $query->where('bedrooms', '>=', $this->bedrooms_min);
        }

        if ($this->bathrooms_min > 0) {
            $query->where('bathrooms', '>=', $this->bathrooms_min);
        }

        return $query->with('media')->limit(20)->get();
    }
}
