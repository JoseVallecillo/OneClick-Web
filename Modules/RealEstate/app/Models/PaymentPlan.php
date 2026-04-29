<?php

namespace Modules\RealEstate\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentPlan extends Model
{
    protected $table = 're_payment_plans';

    protected $fillable = [
        'deal_id', 'type', 'total_amount', 'down_payment', 'financed_amount',
        'installment_count', 'installment_amount', 'first_due_date', 'notes', 'created_by',
    ];

    protected $casts = [
        'total_amount'       => 'decimal:4',
        'down_payment'       => 'decimal:4',
        'financed_amount'    => 'decimal:4',
        'installment_amount' => 'decimal:4',
        'first_due_date'     => 'date',
    ];

    public function deal(): BelongsTo
    {
        return $this->belongsTo(RealEstateDeal::class, 'deal_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function installments(): HasMany
    {
        return $this->hasMany(PaymentInstallment::class)->orderBy('number');
    }

    public function paidAmount(): float
    {
        return (float) $this->installments()->where('status', 'paid')->sum('amount');
    }

    public function pendingAmount(): float
    {
        return (float) $this->total_amount - $this->paidAmount();
    }
}
