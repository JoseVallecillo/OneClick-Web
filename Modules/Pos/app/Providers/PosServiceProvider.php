<?php

namespace Modules\Pos\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class PosServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Pos';

    protected string $nameLower = 'pos';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
