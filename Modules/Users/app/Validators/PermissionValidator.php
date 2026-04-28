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
            // Users module
            'users.create',
            'users.read',
            'users.update',
            'users.delete',
            'profiles.create',
            'profiles.read',
            'profiles.update',
            'profiles.delete',
            // Governance module
            'governance.rules.create',
            'governance.rules.read',
            'governance.rules.update',
            'governance.rules.delete',
            'governance.validators.create',
            'governance.validators.read',
            'governance.validators.update',
            'governance.validators.delete',
            // Accounting module
            'accounting.accounts.create',
            'accounting.accounts.read',
            'accounting.accounts.update',
            'accounting.accounts.delete',
            'accounting.movements.create',
            'accounting.movements.post',
            'accounting.movements.reverse',
            'accounting.budgets.create',
            'accounting.budgets.update',
            'accounting.periods.close',
            // POS module
            'pos.sessions.open',
            'pos.sessions.close',
            'pos.sales.create',
            'pos.sales.cancel',
            'pos.sales.refund',
            'pos.discounts.apply',
            'pos.reports.view',
            // Inventory module
            'inventory.products.create',
            'inventory.products.read',
            'inventory.products.update',
            'inventory.products.delete',
            'inventory.stock.adjust',
            'inventory.transfers.create',
            'inventory.transfers.approve',
            'inventory.counts.execute',
        ];
    }
}
