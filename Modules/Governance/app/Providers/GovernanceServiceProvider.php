<?php

namespace Modules\Governance\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\Governance\Console\Commands\ExpireGovernanceRequests;
use Modules\Governance\Console\Commands\PruneGovernanceAuditLogs;
use Nwidart\Modules\Support\ModuleServiceProvider;

class GovernanceServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Governance';

    protected string $nameLower = 'governance';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];

    protected array $commands = [
        ExpireGovernanceRequests::class,
        PruneGovernanceAuditLogs::class,
    ];

    protected function configureSchedules(Schedule $schedule): void
    {
        $schedule->command('governance:expire-requests')->everyMinute();
        $schedule->command('governance:prune-audit-logs')->daily();
    }
}
