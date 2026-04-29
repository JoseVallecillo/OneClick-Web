<?php

namespace Modules\Subscriptions\Providers;

use Modules\Subscriptions\Console\Commands\ExpireSubscriptions;
use Nwidart\Modules\Support\ModuleServiceProvider;

class SubscriptionsServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Subscriptions';

    protected string $nameLower = 'subscriptions';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];

    protected array $commands = [
        ExpireSubscriptions::class,
        \Modules\Subscriptions\Console\Commands\PruneSubscriptionsAuditLogs::class,
    ];

    public function boot(): void
    {
        parent::boot();

        // Registrar vistas Blade del módulo (requerido para Mailables)
        $this->loadViewsFrom(module_path('Subscriptions', 'resources/views'), 'Subscriptions');

        if ($this->app->runningInConsole()) {
            $this->commands($this->commands);
        }
    }

    protected function configureSchedules(\Illuminate\Console\Scheduling\Schedule $schedule): void
    {
        $schedule->command('subscriptions:prune-audit-logs')->daily();
    }
}
