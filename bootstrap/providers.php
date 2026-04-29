<?php

use App\Providers\AppServiceProvider;
use App\Providers\FortifyServiceProvider;
use Nwidart\Modules\LaravelModulesServiceProvider;

return [
    LaravelModulesServiceProvider::class,
    AppServiceProvider::class,
    FortifyServiceProvider::class,
];
