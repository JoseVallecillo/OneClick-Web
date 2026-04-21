<?php

namespace Modules\RealEstate\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class RealEstateServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'RealEstate';

    protected string $nameLower = 'realestate';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
