<?php

namespace Modules\Pos\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Modules\Pos\Models\PosAuditLog;

class PosAuditService
{
    public static function log(
        string $entityType,
        ?int $entityId,
        string $action,
        ?User $user,
        ?float $amount = null,
        ?array $details = null,
        ?string $reason = null,
        ?Request $request = null,
    ): void {
        PosAuditLog::create([
            'entity_type' => $entityType,
            'entity_id'   => $entityId,
            'action'      => $action,
            'user_id'     => $user?->id,
            'amount'      => $amount,
            'details'     => $details,
            'reason'      => $reason,
            'ip_address'  => $request?->ip(),
            'created_at'  => now(),
        ]);
    }

    public static function logSessionOpened($sessionId, array $data, User $user, Request $request): void
    {
        self::log(
            'session',
            $sessionId,
            'open_session',
            $user,
            null,
            [
                'warehouse_id' => $data['warehouse_id'],
                'currency_id'  => $data['currency_id'],
                'opening_balance' => $data['opening_balance'] ?? 0,
            ],
            null,
            $request,
        );
    }

    public static function logSessionClosed($sessionId, float $closingBalance, User $user, Request $request): void
    {
        self::log(
            'session',
            $sessionId,
            'close_session',
            $user,
            $closingBalance,
            null,
            null,
            $request,
        );
    }

    public static function logSaleCreated($saleId, float $amount, array $details, User $user, Request $request): void
    {
        self::log(
            'sale',
            $saleId,
            'create',
            $user,
            $amount,
            $details,
            null,
            $request,
        );
    }

    public static function logSaleCancelled($saleId, float $amount, string $reason, User $user, Request $request): void
    {
        self::log(
            'sale',
            $saleId,
            'cancel',
            $user,
            $amount,
            null,
            $reason,
            $request,
        );
    }

    public static function logRefundProcessed($saleId, float $amount, string $reason, User $user, Request $request): void
    {
        self::log(
            'sale',
            $saleId,
            'refund',
            $user,
            $amount,
            null,
            $reason,
            $request,
        );
    }

    public static function logDiscountApplied($saleId, float $discountAmount, User $user, Request $request): void
    {
        self::log(
            'discount',
            $saleId,
            'apply',
            $user,
            $discountAmount,
            null,
            null,
            $request,
        );
    }

    public static function logCashDifference($sessionId, float $expectedAmount, float $actualAmount, User $user, Request $request): void
    {
        self::log(
            'session',
            $sessionId,
            'cash_difference',
            $user,
            $actualAmount - $expectedAmount,
            [
                'expected' => $expectedAmount,
                'actual'   => $actualAmount,
            ],
            null,
            $request,
        );
    }
}
