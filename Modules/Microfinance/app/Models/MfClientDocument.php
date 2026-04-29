<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MfClientDocument extends Model
{
    protected $table = 'mf_client_documents';
    protected $fillable = ['client_id','document_type','document_number','file_path','expires_at','verified'];
    protected $casts = ['expires_at' => 'date', 'verified' => 'boolean'];

    public function client(): BelongsTo { return $this->belongsTo(MfClient::class, 'client_id'); }
}
