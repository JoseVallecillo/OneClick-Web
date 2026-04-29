<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mf_loan_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('mf_loans')->cascadeOnDelete();
            $table->unsignedSmallInteger('installment_number');
            $table->date('due_date');
            $table->decimal('principal', 12, 2);
            $table->decimal('interest', 12, 2);
            $table->decimal('insurance', 12, 2)->default(0);
            $table->decimal('total_due', 12, 2);
            $table->decimal('balance_after', 14, 2);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->string('status', 20)->default('pending'); // pending, paid, partial, overdue
            $table->date('paid_date')->nullable();
            $table->timestamps();

            $table->unique(['loan_id', 'installment_number']);
            $table->index(['due_date', 'status']);
        });

        Schema::create('mf_loan_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('mf_loans')->cascadeOnDelete();
            $table->unsignedBigInteger('schedule_id')->nullable();
            $table->unsignedBigInteger('collected_by'); // advisor user_id
            $table->unsignedBigInteger('reconciliation_id')->nullable();
            $table->date('payment_date');
            $table->decimal('amount', 12, 2);
            $table->decimal('principal_applied', 12, 2)->default(0);
            $table->decimal('interest_applied', 12, 2)->default(0);
            $table->decimal('late_fee_applied', 12, 2)->default(0);
            $table->decimal('insurance_applied', 12, 2)->default(0);
            $table->string('payment_method', 20)->default('cash'); // cash, transfer, mobile_wallet
            $table->string('receipt_number', 30)->nullable();
            $table->string('notes')->nullable();
            $table->boolean('reconciled')->default(false);
            $table->timestamps();

            $table->index(['loan_id', 'payment_date']);
            $table->index(['collected_by', 'payment_date']);
        });

        // Daily late fee accruals log
        Schema::create('mf_late_fee_accruals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('mf_loans')->cascadeOnDelete();
            $table->date('accrual_date');
            $table->decimal('fee_amount', 10, 2);
            $table->decimal('principal_balance_at', 14, 2);
            $table->string('fee_type', 20); // fixed_daily, daily_pct
            $table->timestamps();

            $table->unique(['loan_id', 'accrual_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mf_late_fee_accruals');
        Schema::dropIfExists('mf_loan_payments');
        Schema::dropIfExists('mf_loan_schedules');
    }
};
