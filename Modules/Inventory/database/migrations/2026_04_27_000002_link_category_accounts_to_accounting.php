<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_categories', function (Blueprint $table) {
            $table->dropColumn(['account_inventory', 'account_income', 'account_cogs']);
        });

        Schema::table('product_categories', function (Blueprint $table) {
            $table->foreignId('account_inventory_id')->nullable()->after('name')->constrained('account_accounts')->nullOnDelete();
            $table->foreignId('account_income_id')->nullable()->after('account_inventory_id')->constrained('account_accounts')->nullOnDelete();
            $table->foreignId('account_cogs_id')->nullable()->after('account_income_id')->constrained('account_accounts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('product_categories', function (Blueprint $table) {
            $table->dropForeign(['account_inventory_id']);
            $table->dropForeign(['account_income_id']);
            $table->dropForeign(['account_cogs_id']);
            $table->dropColumn(['account_inventory_id', 'account_income_id', 'account_cogs_id']);
        });

        Schema::table('product_categories', function (Blueprint $table) {
            $table->string('account_inventory', 50)->nullable();
            $table->string('account_income', 50)->nullable();
            $table->string('account_cogs', 50)->nullable();
        });
    }
};
