<?php

namespace Modules\Contacts\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Contact extends Model
{
    protected $fillable = [
        'name',
        'legal_name',
        'rtn',
        'dni',
        'email',
        'phone',
        'mobile',
        'website',
        'is_client',
        'is_supplier',
        'is_employee',
        'notes',
        'active',
        'credit_limit',
        'outstanding_balance',
        'total_purchases',
        'last_purchase_date',
        'last_payment_date',
        'preferred_contact_method',
        'preferred_language',
        'is_tax_exempt',
    ];

    protected function casts(): array
    {
        return [
            'is_client'   => 'boolean',
            'is_supplier' => 'boolean',
            'is_employee' => 'boolean',
            'active'      => 'boolean',
            'is_tax_exempt' => 'boolean',
            'credit_limit' => 'decimal:2',
            'outstanding_balance' => 'decimal:2',
            'total_purchases' => 'decimal:2',
            'last_purchase_date' => 'datetime',
            'last_payment_date' => 'datetime',
        ];
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(ContactAddress::class)->orderBy('type')->orderBy('is_default', 'desc');
    }

    public function persons(): HasMany
    {
        return $this->hasMany(ContactPerson::class)->orderBy('name');
    }

    public function paymentTerms(): HasMany
    {
        return $this->hasMany(ContactPaymentTerm::class);
    }

    public function bankDetails(): HasMany
    {
        return $this->hasMany(ContactBankDetail::class);
    }

    public function classifications(): HasMany
    {
        return $this->hasMany(ContactClassification::class);
    }

    public function communications(): HasMany
    {
        return $this->hasMany(ContactCommunication::class)->orderByDesc('communication_date');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ContactDocument::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(ContactTag::class, 'contact_tag_relations');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(ContactAuditLog::class)->orderByDesc('created_at');
    }

    public function supplierEvaluation(): HasOne
    {
        return $this->hasOne(SupplierEvaluation::class);
    }

    public function customFieldValues(): HasMany
    {
        return $this->hasMany(ContactCustomFieldValue::class);
    }

    public function barbershopProfile(): HasOne
    {
        return $this->hasOne(\Modules\Barbershop\Models\BarbershopClientProfile::class, 'contact_id');
    }

    public function getDefaultPaymentTerm(): ?ContactPaymentTerm
    {
        return $this->paymentTerms()->where('is_default', true)->first();
    }

    public function getDefaultBankDetail(): ?ContactBankDetail
    {
        return $this->bankDetails()->where('is_default', true)->first();
    }

    public function getRemainingCredit(): float
    {
        return max(0, ($this->credit_limit ?? 0) - ($this->outstanding_balance ?? 0));
    }

    public function isOverdue(): bool
    {
        return ($this->outstanding_balance ?? 0) > 0;
    }
}
