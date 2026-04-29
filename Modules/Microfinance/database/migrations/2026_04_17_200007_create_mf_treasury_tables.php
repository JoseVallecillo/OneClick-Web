<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mf_disbursements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('mf_loans')->cascadeOnDelete();
            $table->unsignedBigInteger('processed_by');
            $table->decimal('amount', 14, 2);
            $table->string('channel', 20); // cash, transfer, check
            $table->string('bank_name', 80)->nullable();
            $table->string('account_number', 60)->nullable();
            $table->string('check_number', 30)->nullable();
            $table->string('transfer_reference', 80)->nullable();
            $table->date('disbursement_date');
            $table->string('status', 20)->default('pending'); // pending, completed, reversed
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('mf_portfolio_reconciliations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('advisor_id');
            $table->date('reconciliation_date');
            $table->decimal('expected_amount', 14, 2)->default(0);
            $table->decimal('submitted_amount', 14, 2)->default(0);
            $table->decimal('verified_amount', 14, 2)->default(0);
            $table->decimal('difference', 12, 2)->default(0);
            $table->string('status', 20)->default('pending'); // pending, submitted, verified, discrepancy
            $table->unsignedBigInteger('verified_by')->nullable();
            $table->dateTime('submitted_at')->nullable();
            $table->dateTime('verified_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['advisor_id', 'reconciliation_date']);
        });

        Schema::create('mf_reconciliation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reconciliation_id')->constrained('mf_portfolio_reconciliations')->cascadeOnDelete();
            $table->foreignId('loan_id')->constrained('mf_loans');
            $table->foreignId('client_id')->constrained('mf_clients');
            $table->decimal('expected_amount', 12, 2);
            $table->decimal('collected_amount', 12, 2)->default(0);
            $table->string('payment_method', 20)->nullable();
            $table->string('status', 20)->default('pending'); // pending, collected, missed, promise
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mf_reconciliation_items');
        Schema::dropIfExists('mf_portfolio_reconciliations');
        Schema::dropIfExists('mf_disbursements');
    }
};
