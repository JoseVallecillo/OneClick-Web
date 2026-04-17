<?php

namespace Modules\Hospitality\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class HospitalityServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Hospitality';
    protected string $nameLower = 'hospitality';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
