<?php

namespace Modules\Governance\Services;

use App\Models\User;

class GovernancePermissionService
{
    public static function hasPermission(User $user, ?string $requiredPermission): bool
    {
        if (!$requiredPermission) {
            return true;
        }

        if ($user->role === 'admin') {
            return true;
        }

        $userPermissions = $user->permissions;

        if (!is_array($userPermissions)) {
            return false;
        }

        return isset($userPermissions[$requiredPermission]) && $userPermissions[$requiredPermission] === true;
    }

    public static function ensurePermission(User $user, ?string $requiredPermission): void
    {
        if (!self::hasPermission($user, $requiredPermission)) {
            abort(403, 'Insufficient permissions to perform this action.');
        }
    }
}
