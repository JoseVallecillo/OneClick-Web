<?php

namespace Modules\Barbershop\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class BarbershopServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Barbershop';

    protected string $nameLower = 'barbershop';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
