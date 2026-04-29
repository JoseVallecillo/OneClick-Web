<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('account_move_lines', function (Blueprint $table) {
            $table->foreignId('analytical_account_id')->nullable()->constrained('account_analytical_accounts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('account_move_lines', function (Blueprint $table) {
            $table->dropConstrainedForeignId('analytical_account_id');
        });
    }
};
