<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pos_tables', function (Blueprint $table) {
            $table->foreignId('current_order_id')
                ->nullable()
                ->after('current_sale_id')
                ->constrained('pos_orders')
                ->nullOnDelete();
            $table->foreignId('pos_waiter_id')
                ->nullable()
                ->after('current_order_id')
                ->constrained('pos_waiters')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pos_tables', function (Blueprint $table) {
            $table->dropForeign(['current_order_id']);
            $table->dropForeign(['pos_waiter_id']);
            $table->dropColumn(['current_order_id', 'pos_waiter_id']);
        });
    }
};
