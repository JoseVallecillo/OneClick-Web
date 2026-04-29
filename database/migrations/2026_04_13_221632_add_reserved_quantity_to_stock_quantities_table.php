<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('stock_quantities')) {
            return;
        }

        Schema::table('stock_quantities', function (Blueprint $table) {
            $table->decimal('reserved_quantity', 12, 4)->default(0)->after('quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('stock_quantities')) {
            return;
        }

        Schema::table('stock_quantities', function (Blueprint $table) {
            $table->dropColumn('reserved_quantity');
        });
    }
};
