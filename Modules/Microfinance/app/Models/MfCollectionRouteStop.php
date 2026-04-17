<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MfCollectionRouteStop extends Model
{
    protected $table = 'mf_collection_route_stops';
    protected $fillable = ['route_id','loan_id','client_id','sort_order','amount_due','days_overdue','latitude','longitude','status','collected_amount','visited_at','notes'];
    protected $casts = ['visited_at' => 'datetime'];

    public function route(): BelongsTo  { return $this->belongsTo(MfCollectionRoute::class, 'route_id'); }
    public function loan(): BelongsTo   { return $this->belongsTo(MfLoan::class, 'loan_id'); }
    public function client(): BelongsTo { return $this->belongsTo(MfClient::class, 'client_id'); }
}
