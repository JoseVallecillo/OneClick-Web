<?php

namespace Modules\Pos\Database\Seeders;

use Illuminate\Database\Seeder;

class PosDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(PosTableSeeder::class);
    }
}
