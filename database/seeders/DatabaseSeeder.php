<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Profile;
use App\Services\TrialProvisioner;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Nwidart\Modules\Facades\Module;

class DatabaseSeeder extends Seeder
{
    /**
     * Módulos habilitados por defecto en una instalación nueva.
     */
    private const DEFAULT_MODULES = [
        'AppStore',
        'Settings',
        'Subscriptions',
        'Users',
        'Governance',
    ];

    public function run(): void
    {
        // 1. Configurar módulos por defecto
        $this->setupModules();

        // 2. Perfil administrador
        $profile = Profile::firstOrCreate(
            ['name' => 'Administrador'],
            ['name' => 'Administrador', 'permissions' => ['*' => true]]
        );

        // 3. Usuario administrador por defecto
        $admin = User::firstOrCreate(
            ['email' => 'admin@oneclick.com'],
            [
                'name'              => 'Oneclick',
                'password'          => Hash::make('Admin@1989'),
                'email_verified_at' => now(),
                'role'              => 'admin',
                'profile_id'        => $profile->id,
            ]
        );

        // Asegurarse de que el admin tenga el perfil y rol correctos
        $admin->update(['role' => 'admin', 'profile_id' => $profile->id]);

        // 4. Empresa + sucursal + suscripción de prueba 30 días
        app(TrialProvisioner::class)->provision();

        // 5. Vincular admin a la sucursal principal
        $this->linkAdminToBranch($admin);
    }

    private function setupModules(): void
    {
        try {
            foreach (Module::all() as $module) {
                $name = $module->getName();
                if (in_array($name, self::DEFAULT_MODULES, true)) {
                    $module->enable();
                } else {
                    $module->disable();
                }
            }
        } catch (\Throwable) {}
    }

    private function linkAdminToBranch(User $admin): void
    {
        try {
            $branch = \Modules\Settings\Models\Branch::first();
            if ($branch && ! $admin->branches()->where('branch_id', $branch->id)->exists()) {
                $admin->branches()->attach($branch->id);
            }
        } catch (\Throwable) {}
    }
}
