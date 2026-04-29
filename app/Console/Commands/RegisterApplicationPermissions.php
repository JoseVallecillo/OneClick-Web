<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Modules\Users\Validators\PermissionValidator;

class RegisterApplicationPermissions extends Command
{
    protected $signature = 'app:register-permissions';
    protected $description = 'Register all application permissions from modules.';

    public function handle(): int
    {
        $permissions = [
            // Users module
            'users.create',
            'users.read',
            'users.update',
            'users.delete',
            'profiles.create',
            'profiles.read',
            'profiles.update',
            'profiles.delete',
            // Governance module
            'governance.rules.create',
            'governance.rules.read',
            'governance.rules.update',
            'governance.rules.delete',
            'governance.validators.create',
            'governance.validators.read',
            'governance.validators.update',
            'governance.validators.delete',
        ];

        PermissionValidator::registerPermissions($permissions);

        $this->info('Permissions registered successfully: ' . count($permissions));
        return self::SUCCESS;
    }
}
