<?php

namespace Modules\RealEstate\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Commission extends Model
{
    protected $table = 're_commissions';

    protected $fillable = [
        'deal_id', 'agent_id', 'commission_pct', 'base_amount', 'commission_amount',
        'status', 'notes', 'approved_by', 'approved_at', 'paid_at', 'payment_reference', 'created_by',
    ];

    protected $casts = [
        'commission_pct'    => 'decimal:2',
        'base_amount'       => 'decimal:4',
        'commission_amount' => 'decimal:4',
        'approved_at'       => 'datetime',
        'paid_at'           => 'datetime',
    ];

    public function deal(): BelongsTo
    {
        return $this->belongsTo(RealEstateDeal::class, 'deal_id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
