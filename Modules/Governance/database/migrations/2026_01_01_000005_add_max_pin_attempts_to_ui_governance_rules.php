<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ui_governance_rules', function (Blueprint $table) {
            $table->unsignedTinyInteger('max_pin_attempts')->default(3)->after('pin_code')
                ->comment('Max wrong PIN attempts before locking. Only applies to action_type=pin.');
        });
    }

    public function down(): void
    {
        Schema::table('ui_governance_rules', function (Blueprint $table) {
            $table->dropColumn('max_pin_attempts');
        });
    }
};
