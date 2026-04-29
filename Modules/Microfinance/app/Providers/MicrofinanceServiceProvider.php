<?php

namespace Modules\Microfinance\app\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class MicrofinanceServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Microfinance';
    protected string $nameLower = 'microfinance';
    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
