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

    public function boot(): void
    {
        parent::boot();

        // Registrar vistas Blade del módulo (requerido para Mailables)
        $this->loadViewsFrom(module_path('Subscriptions', 'resources/views'), 'Subscriptions');

        if ($this->app->runningInConsole()) {
            $this->commands([ExpireSubscriptions::class]);
        }
    }
}
