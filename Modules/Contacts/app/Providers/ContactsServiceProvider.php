<?php

namespace Modules\Contacts\Providers;

use Nwidart\Modules\Support\ModuleServiceProvider;

class ContactsServiceProvider extends ModuleServiceProvider
{
    protected string $name = 'Contacts';

    protected string $nameLower = 'contacts';

    protected array $providers = [
        EventServiceProvider::class,
        RouteServiceProvider::class,
    ];
}
