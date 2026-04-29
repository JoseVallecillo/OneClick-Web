<?php

namespace Modules\Rentals\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class RentalsServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Rentals';

    protected string $nameLower = 'rentals';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
