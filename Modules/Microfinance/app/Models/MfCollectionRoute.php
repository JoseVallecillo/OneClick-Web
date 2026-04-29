<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MfCollectionRoute extends Model
{
    protected $table = 'mf_collection_routes';
    protected $fillable = ['advisor_id','route_date','zone','status','total_stops','visited_stops','expected_amount','collected_amount'];
    protected $casts = ['route_date' => 'date'];

    public function stops(): HasMany { return $this->hasMany(MfCollectionRouteStop::class, 'route_id')->orderBy('sort_order'); }
}
