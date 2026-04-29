<?php

namespace Modules\Contacts\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Modules\Contacts\Console\Commands\PruneContactsAuditLogs;
use Nwidart\Modules\Support\ModuleServiceProvider;

class ContactsServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Contacts';

    protected string $nameLower = 'contacts';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];

    protected array $commands = [
        PruneContactsAuditLogs::class,
    ];

    protected function configureSchedules(Schedule $schedule): void
    {
        $schedule->command('contacts:prune-audit-logs')->daily();
    }
}
