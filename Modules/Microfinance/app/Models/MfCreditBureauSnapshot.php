<?php

namespace Modules\Microfinance\app\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MfCreditBureauSnapshot extends Model
{
    protected $table = 'mf_credit_bureau_snapshots';
    protected $fillable = ['generated_by','report_type','as_of_date','record_count','file_path'];
    protected $casts = ['as_of_date' => 'date'];

    public function generatedByUser(): BelongsTo { return $this->belongsTo(User::class, 'generated_by'); }

    public function getGeneratedAtAttribute(): string { return $this->created_at?->toIso8601String() ?? ''; }
}
