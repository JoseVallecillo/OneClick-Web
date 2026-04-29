<?php

namespace Modules\Sales\Services;

use App\Exceptions\InsufficientPermissionsException;
use App\Models\User;

class SalesPermissionService
{
    public static function hasPermission(User $user, ?string $requiredPermission): bool
    {
        if (!$requiredPermission || $user->role === 'admin') return true;
        $perms = $user->permissions;
        return is_array($perms) && isset($perms[$requiredPermission]) && $perms[$requiredPermission] === true;
    }

    public static function ensurePermission(User $user, ?string $requiredPermission): void
    {
        if (!self::hasPermission($user, $requiredPermission)) {
            throw new InsufficientPermissionsException($requiredPermission ?? 'unknown');
        }
    }
}
