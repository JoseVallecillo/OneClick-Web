<?php

namespace Modules\Purchases\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class PurchasesServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Purchases';

    protected string $nameLower = 'purchases';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
