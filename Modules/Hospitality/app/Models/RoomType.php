<?php

namespace Modules\Hospitality\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RoomType extends Model
{
    protected $table = 'hospitality_room_types';

    protected $fillable = ['name', 'base_price', 'capacity_adults', 'capacity_kids'];

    protected $casts = [
        'base_price'       => 'decimal:2',
        'capacity_adults'  => 'integer',
        'capacity_kids'    => 'integer',
    ];

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class, 'room_type_id');
    }
}
