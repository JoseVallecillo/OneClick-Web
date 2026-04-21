<?php

namespace Modules\RealEstate\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Property extends Model
{
    protected $table = 're_properties';

    protected $fillable = [
        'reference', 'type', 'status', 'title', 'description',
        'address', 'city', 'zone', 'department', 'latitude', 'longitude',
        'land_area', 'build_area', 'bedrooms', 'bathrooms', 'parking_spots', 'floors', 'soil_type',
        'has_water', 'has_electricity', 'has_gas', 'has_internet', 'has_sewage',
        'sale_price', 'rent_price', 'currency',
        'agent_id', 'created_by', 'notes',
    ];

    protected $casts = [
        'latitude'       => 'decimal:7',
        'longitude'      => 'decimal:7',
        'land_area'      => 'decimal:2',
        'build_area'     => 'decimal:2',
        'sale_price'     => 'decimal:4',
        'rent_price'     => 'decimal:4',
        'has_water'      => 'boolean',
        'has_electricity'=> 'boolean',
        'has_gas'        => 'boolean',
        'has_internet'   => 'boolean',
        'has_sewage'     => 'boolean',
    ];

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function media(): HasMany
    {
        return $this->hasMany(PropertyMedia::class)->orderBy('sort_order');
    }

    public function mainPhoto(): ?PropertyMedia
    {
        return $this->media()->where('is_main', true)->where('type', 'photo')->first()
            ?? $this->media()->where('type', 'photo')->first();
    }

    public function deals(): HasMany
    {
        return $this->hasMany(RealEstateDeal::class);
    }

    public function condoFees(): HasMany
    {
        return $this->hasMany(CondoFee::class);
    }

    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class);
    }

    public static function generateReference(): string
    {
        $year   = now()->year;
        $prefix = "PR-{$year}-";
        $last   = static::where('reference', 'like', $prefix . '%')->orderByDesc('reference')->value('reference');
        $next   = $last ? ((int) substr($last, -4)) + 1 : 1;
        return $prefix . str_pad($next, 4, '0', STR_PAD_LEFT);
    }

    public function isAvailable(): bool { return $this->status === 'available'; }
    public function isReserved(): bool  { return $this->status === 'reserved';  }
    public function isSold(): bool      { return $this->status === 'sold';      }
    public function isRented(): bool    { return $this->status === 'rented';    }
}
