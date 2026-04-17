<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_journals', function (Blueprint $table) {
            $table->id();

            $table->string('name', 100);

            // Short code used in references: VJ, CJ, BJ, CAJ, GJ
            $table->string('code', 10)->unique();

            // Journal type determines available workflow and default accounts
            $table->enum('type', ['sales', 'purchases', 'bank', 'cash', 'general'])->index();

            // Default accounts for automatic entry generation
            $table->foreignId('default_debit_account_id')->nullable()->constrained('account_accounts')->nullOnDelete();
            $table->foreignId('default_credit_account_id')->nullable()->constrained('account_accounts')->nullOnDelete();

            // Bank/Cash journals: linked bank account number
            $table->string('bank_account_number', 50)->nullable();

            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_journals');
    }
};
