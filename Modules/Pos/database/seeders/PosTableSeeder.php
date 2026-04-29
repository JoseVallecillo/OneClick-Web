<?php

namespace Modules\Pos\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Pos\Models\PosTable;

class PosTableSeeder extends Seeder
{
    public function run(): void
    {
        $tables = [
            // Interior — square
            ['number' => 1,  'section' => 'Interior', 'shape' => 'square', 'capacity' => 4,  'status' => 'available'],
            ['number' => 2,  'section' => 'Interior', 'shape' => 'square', 'capacity' => 4,  'status' => 'occupied',     'server_name' => 'María López',   'opened_at' => now()->subMinutes(45), 'total' => 850.00],
            ['number' => 3,  'section' => 'Interior', 'shape' => 'square', 'capacity' => 6,  'status' => 'pending_food', 'server_name' => 'Carlos Reyes',  'opened_at' => now()->subMinutes(20), 'total' => 430.00],
            ['number' => 4,  'section' => 'Interior', 'shape' => 'square', 'capacity' => 4,  'status' => 'available'],
            ['number' => 5,  'section' => 'Interior', 'shape' => 'square', 'capacity' => 4,  'status' => 'occupied',     'server_name' => 'Ana Torres',    'opened_at' => now()->subMinutes(30), 'total' => 1200.00],
            ['number' => 6,  'section' => 'Interior', 'shape' => 'square', 'capacity' => 8,  'status' => 'available'],
            // Interior — circle
            ['number' => 7,  'section' => 'Interior', 'shape' => 'circle', 'capacity' => 2,  'status' => 'available'],
            ['number' => 8,  'section' => 'Interior', 'shape' => 'circle', 'capacity' => 2,  'status' => 'pending_food', 'server_name' => 'Luis Méndez',   'opened_at' => now()->subMinutes(35), 'total' => 290.00],
            ['number' => 9,  'section' => 'Interior', 'shape' => 'circle', 'capacity' => 2,  'status' => 'occupied',     'server_name' => 'María López',   'opened_at' => now()->subMinutes(55), 'total' => 620.00],
            // Terraza — square
            ['number' => 10, 'section' => 'Terraza',  'shape' => 'square', 'capacity' => 4,  'status' => 'available'],
            ['number' => 11, 'section' => 'Terraza',  'shape' => 'square', 'capacity' => 4,  'status' => 'occupied',     'server_name' => 'Pedro Ruiz',    'opened_at' => now()->subMinutes(15), 'total' => 450.00],
            ['number' => 12, 'section' => 'Terraza',  'shape' => 'square', 'capacity' => 6,  'status' => 'available'],
            // Terraza — circle
            ['number' => 13, 'section' => 'Terraza',  'shape' => 'circle', 'capacity' => 2,  'status' => 'pending_food', 'server_name' => 'Ana Torres',    'opened_at' => now()->subMinutes(25), 'total' => 680.00],
            ['number' => 14, 'section' => 'Terraza',  'shape' => 'circle', 'capacity' => 2,  'status' => 'available'],
            // Bar — circle
            ['number' => 15, 'section' => 'Bar',      'shape' => 'circle', 'capacity' => 2,  'status' => 'occupied',     'server_name' => 'Luis Méndez',   'opened_at' => now()->subMinutes(70), 'total' => 920.00],
            ['number' => 16, 'section' => 'Bar',      'shape' => 'circle', 'capacity' => 2,  'status' => 'available'],
            ['number' => 17, 'section' => 'Bar',      'shape' => 'square', 'capacity' => 4,  'status' => 'available'],
            // VIP — square
            ['number' => 18, 'section' => 'VIP',      'shape' => 'square', 'capacity' => 8,  'status' => 'available'],
            ['number' => 19, 'section' => 'VIP',      'shape' => 'square', 'capacity' => 8,  'status' => 'occupied',     'server_name' => 'Sofía Castro',  'opened_at' => now()->subMinutes(90), 'total' => 3200.00],
            ['number' => 20, 'section' => 'VIP',      'shape' => 'circle', 'capacity' => 4,  'status' => 'pending_food', 'server_name' => 'Carlos Reyes',  'opened_at' => now()->subMinutes(40), 'total' => 1450.00],
        ];

        foreach ($tables as $data) {
            PosTable::firstOrCreate(['number' => $data['number']], $data);
        }
    }
}
