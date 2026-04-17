<?php

namespace Modules\CarService\Database\Seeders;

use Illuminate\Database\Seeder;

class CarServiceDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Seed sample service packages / combos
        $packages = [
            [
                'name'          => 'Cambio Aceite Mineral 20W-50',
                'description'   => 'Cambio de aceite mineral con filtro de aceite incluido.',
                'oil_type'      => 'mineral',
                'oil_viscosity' => '20W-50',
                'base_price'    => 350.00,
                'active'        => true,
            ],
            [
                'name'          => 'Cambio Aceite Semi-Sintético 10W-40',
                'description'   => 'Cambio de aceite semi-sintético con filtro y revisión de niveles.',
                'oil_type'      => 'semi_synthetic',
                'oil_viscosity' => '10W-40',
                'base_price'    => 550.00,
                'active'        => true,
            ],
            [
                'name'          => 'Cambio Aceite Sintético 5W-30',
                'description'   => 'Cambio de aceite 100% sintético con filtro premium. Máxima protección del motor.',
                'oil_type'      => 'synthetic',
                'oil_viscosity' => '5W-30',
                'base_price'    => 850.00,
                'active'        => true,
            ],
            [
                'name'          => 'Cambio Aceite Sintético 0W-20',
                'description'   => 'Aceite ultra-sintético para vehículos modernos de alta eficiencia.',
                'oil_type'      => 'synthetic',
                'oil_viscosity' => '0W-20',
                'base_price'    => 950.00,
                'active'        => true,
            ],
        ];

        foreach ($packages as $pkg) {
            \Modules\CarService\Models\ServicePackage::firstOrCreate(
                ['name' => $pkg['name']],
                $pkg
            );
        }
    }
}
