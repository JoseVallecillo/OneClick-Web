<?php

namespace Modules\CarService\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class CarServiceServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'CarService';

    protected string $nameLower = 'carservice';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
