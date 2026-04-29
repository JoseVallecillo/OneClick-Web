<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MfClientBusinessSnapshot extends Model
{
    protected $table = 'mf_client_business_snapshots';
    protected $fillable = ['client_id','captured_by','latitude','longitude','inventory_value','daily_sales_estimated','monthly_expenses_verified','monthly_net_estimated','observations','photos'];
    protected $casts = ['photos' => 'array'];

    public function client(): BelongsTo { return $this->belongsTo(MfClient::class, 'client_id'); }
}
