<?php

namespace Modules\AutoLote\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class AutoLoteServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'AutoLote';
    protected string $nameLower = 'autolote';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
