<?php

namespace Modules\Pos\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FiscalDocument extends Model
{
    protected $table = 'pos_fiscal_documents';

    protected $fillable = [
        'pos_sale_id',
        'fiscal_number',
        'authorization_code',
        'status',
        'authorized_at',
        'error_message',
        'sar_response',
    ];

    protected $casts = [
        'authorized_at' => 'datetime',
        'sar_response' => 'json',
    ];

    public function sale(): BelongsTo
    {
        return $this->belongsTo(PosSale::class, 'pos_sale_id');
    }

    public function isAuthorized(): bool
    {
        return $this->status === 'authorized';
    }

    public function authorize(string $fiscalNumber, string $authCode, array $response = []): void
    {
        $this->update([
            'status' => 'authorized',
            'fiscal_number' => $fiscalNumber,
            'authorization_code' => $authCode,
            'authorized_at' => now(),
            'sar_response' => $response,
        ]);
    }

    public function fail(string $errorMessage): void
    {
        $this->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
        ]);
    }
}
