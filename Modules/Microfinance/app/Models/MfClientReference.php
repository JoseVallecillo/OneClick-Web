<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MfClientReference extends Model
{
    protected $table = 'mf_client_references';
    protected $fillable = ['client_id','reference_type','name','phone','relationship','verified','notes'];
    protected $casts = ['verified' => 'boolean'];

    public function client(): BelongsTo { return $this->belongsTo(MfClient::class, 'client_id'); }
}
