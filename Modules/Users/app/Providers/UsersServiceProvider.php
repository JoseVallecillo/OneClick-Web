<?php

namespace Modules\Users\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\Users\Console\Commands\PruneUserAuditLogs;
use Nwidart\Modules\Support\ModuleServiceProvider;

class UsersServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Users';

    protected string $nameLower = 'users';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];

    protected array $commands = [
        PruneUserAuditLogs::class,
    ];

    protected function configureSchedules(Schedule $schedule): void
    {
        $schedule->command('users:prune-audit-logs')->daily();
    }
}
