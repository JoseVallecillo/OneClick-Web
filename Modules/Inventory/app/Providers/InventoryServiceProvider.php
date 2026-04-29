<?php

namespace Modules\Inventory\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\Inventory\Console\Commands\PruneInventoryAuditLogs;
use Nwidart\Modules\Support\ModuleServiceProvider;

class InventoryServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Inventory';

    protected string $nameLower = 'inventory';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];

    protected array $commands = [
        PruneInventoryAuditLogs::class,
    ];

    protected function configureSchedules(Schedule $schedule): void
    {
        $schedule->command('inventory:prune-audit-logs')->daily();
    }
}
