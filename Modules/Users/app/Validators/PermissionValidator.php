<?php

namespace Modules\Users\Validators;

class PermissionValidator
{
    private static array $validPermissions = [
        'users.create',
        'users.read',
        'users.update',
        'users.delete',
        'profiles.create',
        'profiles.read',
        'profiles.update',
        'profiles.delete',
    ];

    public static function validate(?array $permissions): bool
    {
        if ($permissions === null) {
            return true;
        }

        foreach (array_keys($permissions) as $permission) {
            if (!in_array($permission, self::$validPermissions, true)) {
                return false;
            }
        }

        return true;
    }

    public static function getValidPermissions(): array
    {
        return self::$validPermissions;
    }

    public static function addPermission(string $permission): void
    {
        if (!in_array($permission, self::$validPermissions, true)) {
            self::$validPermissions[] = $permission;
        }
    }
}
