<?php

namespace Modules\Pos\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\Pos\Console\Commands\PrunePosAuditLogs;
use Nwidart\Modules\Support\ModuleServiceProvider;

class PosServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Pos';

    protected string $nameLower = 'pos';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];

    protected array $commands = [
        PrunePosAuditLogs::class,
    ];

    protected function configureSchedules(Schedule $schedule): void
    {
        $schedule->command('pos:prune-audit-logs')->daily();
    }
}
