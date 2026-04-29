<?php

namespace Modules\Settings\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\Settings\Console\Commands\PruneSettingsAuditLogs;
use Nwidart\Modules\Support\ModuleServiceProvider;

class SettingsServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Settings';

    protected string $nameLower = 'settings';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];

    protected array $commands = [
        PruneSettingsAuditLogs::class,
    ];

    protected function configureSchedules(Schedule $schedule): void
    {
        $schedule->command('settings:prune-audit-logs')->daily();
    }
}
