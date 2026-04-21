<?php

namespace Modules\RealEstate\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentInstallment extends Model
{
    protected $table = 're_payment_installments';

    protected $fillable = [
        'payment_plan_id', 'number', 'amount', 'due_date', 'status',
        'paid_at', 'payment_reference', 'invoice_number', 'notes', 'recorded_by',
    ];

    protected $casts = [
        'amount'  => 'decimal:4',
        'due_date'=> 'date',
        'paid_at' => 'datetime',
    ];

    public function plan(): BelongsTo
    {
        return $this->belongsTo(PaymentPlan::class, 'payment_plan_id');
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function isOverdue(): bool
    {
        return $this->status === 'pending' && $this->due_date->isPast();
    }
}
