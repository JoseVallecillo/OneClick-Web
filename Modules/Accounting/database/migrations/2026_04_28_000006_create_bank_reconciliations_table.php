<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_bank_reconciliations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('account_id')->constrained('account_accounts')->restrictOnDelete();

            $table->date('statement_date');
            $table->decimal('statement_balance', 15, 2);

            $table->decimal('book_balance', 15, 2);
            $table->decimal('difference', 15, 2)->default(0);

            $table->enum('status', ['draft', 'reconciled', 'verified'])->default('draft');

            $table->text('notes')->nullable();
            $table->dateTime('reconciled_at')->nullable();
            $table->unsignedBigInteger('reconciled_by')->nullable();

            $table->timestamps();
        });

        Schema::create('account_reconciliation_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('reconciliation_id')->constrained('account_bank_reconciliations')->cascadeOnDelete();
            $table->foreignId('move_line_id')->nullable()->constrained('account_move_lines')->nullOnDelete();

            $table->date('transaction_date');
            $table->string('reference', 100);
            $table->text('description')->nullable();

            $table->decimal('amount', 15, 2);
            $table->enum('type', ['debit', 'credit']);

            $table->boolean('matched')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_reconciliation_items');
        Schema::dropIfExists('account_bank_reconciliations');
    }
};
