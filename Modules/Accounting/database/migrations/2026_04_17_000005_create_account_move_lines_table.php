<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_move_lines', function (Blueprint $table) {
            $table->id();

            $table->foreignId('move_id')->constrained('account_moves')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('account_accounts');

            // Optional partner (contact: client or supplier)
            $table->foreignId('partner_id')->nullable()->constrained('contacts')->nullOnDelete();

            // Optional tax applied to this line
            $table->foreignId('tax_id')->nullable()->constrained('account_taxes')->nullOnDelete();

            $table->string('name', 500)->nullable();

            // Double-entry amounts — one must be zero, the other positive.
            // DB-level: (debit >= 0) AND (credit >= 0) AND (debit = 0 OR credit = 0)
            $table->decimal('debit', 14, 4)->default(0);
            $table->decimal('credit', 14, 4)->default(0);

            // Currency for multi-currency support
            $table->foreignId('currency_id')->nullable()->constrained('currencies')->nullOnDelete();
            $table->decimal('amount_currency', 14, 4)->nullable();

            // Conciliation / reconciliation mark
            $table->boolean('reconciled')->default(false);
            $table->date('due_date')->nullable();

            $table->timestamps();

            $table->index(['move_id', 'account_id']);
            $table->index(['account_id', 'reconciled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_move_lines');
    }
};
