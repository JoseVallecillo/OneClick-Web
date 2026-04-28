<?php

namespace Modules\Accounting\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Modules\Accounting\Models\AccountingAuditLog;

class AccountingAuditService
{
    public static function log(
        string $entityType,
        ?int $entityId,
        string $action,
        ?User $user,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $reason = null,
        ?Request $request = null,
    ): void {
        AccountingAuditLog::create([
            'entity_type' => $entityType,
            'entity_id'   => $entityId,
            'action'      => $action,
            'user_id'     => $user?->id,
            'old_values'  => $oldValues,
            'new_values'  => $newValues,
            'reason'      => $reason,
            'ip_address'  => $request?->ip(),
            'created_at'  => now(),
        ]);
    }

    public static function logAccountCreation(array $account, User $user, Request $request): void
    {
        self::log(
            'account',
            null,
            'create',
            $user,
            null,
            [
                'code'   => $account['code'],
                'name'   => $account['name'],
                'type'   => $account['type'],
            ],
            null,
            $request,
        );
    }

    public static function logAccountUpdate($accountId, array $oldValues, array $newValues, User $user, Request $request): void
    {
        self::log(
            'account',
            $accountId,
            'update',
            $user,
            $oldValues,
            $newValues,
            null,
            $request,
        );
    }

    public static function logMovementPosted($movementId, array $data, User $user, Request $request): void
    {
        self::log(
            'movement',
            $movementId,
            'post',
            $user,
            null,
            $data,
            null,
            $request,
        );
    }

    public static function logMovementReversal($movementId, $reversalId, string $reason, User $user, Request $request): void
    {
        self::log(
            'movement',
            $movementId,
            'reverse',
            $user,
            ['original_id' => $movementId],
            ['reversal_id' => $reversalId],
            $reason,
            $request,
        );
    }

    public static function logPeriodClosed($periodId, array $data, User $user, Request $request): void
    {
        self::log(
            'period',
            $periodId,
            'close',
            $user,
            null,
            $data,
            null,
            $request,
        );
    }

    public static function logBudgetUpdate($budgetId, array $oldValues, array $newValues, User $user, Request $request): void
    {
        self::log(
            'budget',
            $budgetId,
            'update',
            $user,
            $oldValues,
            $newValues,
            null,
            $request,
        );
    }
}
