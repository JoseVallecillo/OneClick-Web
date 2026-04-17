<?php

namespace Modules\Microfinance\app\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MfCreditGroupMember extends Model
{
    protected $table = 'mf_credit_group_members';
    protected $fillable = ['group_id','client_id','role','status','joined_at','left_at'];
    protected $casts = ['joined_at' => 'date', 'left_at' => 'date'];

    public function scopeActive(Builder $query): Builder { return $query->where('status', 'active'); }

    public function group(): BelongsTo  { return $this->belongsTo(MfCreditGroup::class, 'group_id'); }
    public function client(): BelongsTo { return $this->belongsTo(MfClient::class, 'client_id'); }
}
