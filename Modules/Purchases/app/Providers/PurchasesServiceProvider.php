<?php

namespace Modules\Purchases\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\Purchases\Console\Commands\PrunePurchasesAuditLogs;
use Nwidart\Modules\Support\ModuleServiceProvider;

class PurchasesServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Purchases';

    protected string $nameLower = 'purchases';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];

    protected array $commands = [
        PrunePurchasesAuditLogs::class,
    ];

    protected function configureSchedules(Schedule $schedule): void
    {
        $schedule->command('purchases:prune-audit-logs')->daily();
    }
}
