<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pos_sessions', function (Blueprint $table) {
            $table->decimal('expected_cash', 15, 4)->nullable()->after('total_transfer');
            $table->decimal('actual_cash_counted', 15, 4)->nullable()->after('expected_cash');
            $table->decimal('cash_difference', 15, 4)->nullable()->after('actual_cash_counted');
            $table->text('closing_notes')->nullable()->after('notes');
            $table->unsignedBigInteger('closed_by')->nullable()->after('created_by');
        });
    }

    public function down(): void
    {
        Schema::table('pos_sessions', function (Blueprint $table) {
            $table->dropColumn(['expected_cash', 'actual_cash_counted', 'cash_difference', 'closing_notes', 'closed_by']);
        });
    }
};
