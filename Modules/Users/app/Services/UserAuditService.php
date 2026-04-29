<?php

namespace Modules\Users\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Modules\Users\Models\UserAuditLog;

class UserAuditService
{
    public static function log(
        string $action,
        ?User $user,
        ?User $performedBy,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?Request $request = null,
    ): void {
        UserAuditLog::create([
            'user_id'    => $user?->id,
            'performed_by' => $performedBy?->id,
            'action'     => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'created_at' => now(),
        ]);
    }

    public static function logUserCreation(User $user, User $performedBy, Request $request): void
    {
        self::log(
            'create',
            $user,
            $performedBy,
            null,
            [
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
            $request,
        );
    }

    public static function logRoleUpdate(User $user, string $oldRole, string $newRole, User $performedBy, Request $request): void
    {
        self::log(
            'update_role',
            $user,
            $performedBy,
            ['role' => $oldRole],
            ['role' => $newRole],
            $request,
        );
    }

    public static function logProfileAssignment(User $user, ?int $oldProfileId, ?int $newProfileId, User $performedBy, Request $request): void
    {
        self::log(
            'assign_profile',
            $user,
            $performedBy,
            ['profile_id' => $oldProfileId],
            ['profile_id' => $newProfileId],
            $request,
        );
    }

    public static function logPermissionsUpdate(User $user, ?array $oldPerms, ?array $newPerms, User $performedBy, Request $request): void
    {
        self::log(
            'update_permissions',
            $user,
            $performedBy,
            ['permissions' => $oldPerms],
            ['permissions' => $newPerms],
            $request,
        );
    }

    public static function logUserDeletion(User $user, User $performedBy, Request $request): void
    {
        self::log(
            'delete',
            $user,
            $performedBy,
            [
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
            null,
            $request,
        );
    }

    public static function logUserRestoration(User $user, User $performedBy, Request $request): void
    {
        self::log(
            'restore',
            $user,
            $performedBy,
            null,
            [
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
            $request,
        );
    }
}
