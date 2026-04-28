<?php

namespace Modules\Users\Validators;

use Illuminate\Support\Facades\Cache;

class PermissionValidator
{
    private const PERMISSIONS_CACHE_KEY = 'app:valid_permissions';

    public static function validate(?array $permissions): bool
    {
        if ($permissions === null) {
            return true;
        }

        $validPermissions = self::getValidPermissions();

        foreach (array_keys($permissions) as $permission) {
            if (!in_array($permission, $validPermissions, true)) {
                return false;
            }
        }

        return true;
    }

    public static function getValidPermissions(): array
    {
        return Cache::remember(self::PERMISSIONS_CACHE_KEY, now()->addDays(7), function () {
            return self::getDefaultPermissions();
        });
    }

    public static function registerPermission(string $permission): void
    {
        $permissions = self::getValidPermissions();

        if (!in_array($permission, $permissions, true)) {
            $permissions[] = $permission;
            Cache::put(self::PERMISSIONS_CACHE_KEY, $permissions, now()->addDays(7));
        }
    }

    public static function registerPermissions(array $permissions): void
    {
        foreach ($permissions as $permission) {
            self::registerPermission($permission);
        }
    }

    public static function clearCache(): void
    {
        Cache::forget(self::PERMISSIONS_CACHE_KEY);
    }

    private static function getDefaultPermissions(): array
    {
        return [
            'users.create',
            'users.read',
            'users.update',
            'users.delete',
            'profiles.create',
            'profiles.read',
            'profiles.update',
            'profiles.delete',
            'governance.rules.create',
            'governance.rules.read',
            'governance.rules.update',
            'governance.rules.delete',
            'governance.validators.create',
            'governance.validators.read',
            'governance.validators.update',
            'governance.validators.delete',
        ];
    }
}
