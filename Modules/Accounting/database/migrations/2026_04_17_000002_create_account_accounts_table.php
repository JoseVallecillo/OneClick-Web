<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_accounts', function (Blueprint $table) {
            $table->id();

            // e.g. 1101, 2101, 3101, 4101, 5101 — SAR Honduras chart of accounts codes
            $table->string('code', 20)->unique();
            $table->string('name', 150);
            $table->text('description')->nullable();

            // Account classification per SAR Honduras
            $table->enum('type', ['asset', 'liability', 'equity', 'income', 'expense'])->index();

            // Normal balance direction
            $table->enum('normal_balance', ['debit', 'credit']);

            // Hierarchical chart: a parent account groups child accounts
            $table->foreignId('parent_id')->nullable()->constrained('account_accounts')->nullOnDelete();

            // Only leaf accounts (no children) accept direct journal entries
            $table->boolean('is_leaf')->default(true);

            // Optional link to a tax configuration
            $table->foreignId('tax_id')->nullable()->constrained('account_taxes')->nullOnDelete();

            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_accounts');
    }
};
