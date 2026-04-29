<?php

namespace Modules\Accounting\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\Accounting\Console\Commands\PruneAccountingAuditLogs;
use Nwidart\Modules\Support\ModuleServiceProvider;

class AccountingServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Accounting';

    protected string $nameLower = 'accounting';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];

    protected array $commands = [
        PruneAccountingAuditLogs::class,
    ];

    protected function configureSchedules(Schedule $schedule): void
    {
        $schedule->command('accounting:prune-audit-logs')->daily();
    }
}
