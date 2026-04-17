<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mf_loans', function (Blueprint $table) {
            $table->id();
            $table->string('loan_number', 25)->unique();
            $table->foreignId('client_id')->constrained('mf_clients');
            $table->foreignId('product_id')->constrained('mf_loan_products');
            $table->unsignedBigInteger('group_id')->nullable();
            $table->unsignedBigInteger('advisor_id')->nullable();

            $table->integer('cycle_number')->default(1);

            // Amounts
            $table->decimal('amount_requested', 14, 2);
            $table->decimal('amount_approved', 14, 2)->nullable();
            $table->decimal('disbursed_amount', 14, 2)->nullable();
            $table->decimal('origination_fee', 12, 2)->default(0);
            $table->decimal('insurance_total', 12, 2)->default(0);

            // Terms
            $table->decimal('annual_rate', 6, 2);
            $table->string('rate_calculation', 20)->default('flat');
            $table->string('payment_frequency', 20)->default('weekly');
            $table->integer('term_payments'); // number of installments
            $table->date('first_payment_date')->nullable();
            $table->date('maturity_date')->nullable();

            // Balances
            $table->decimal('principal_balance', 14, 2)->default(0);
            $table->decimal('interest_balance', 14, 2)->default(0);
            $table->decimal('late_fee_balance', 14, 2)->default(0);
            $table->decimal('total_balance', 14, 2)->default(0);

            // Delinquency
            $table->integer('days_overdue')->default(0);
            $table->string('par_category', 5)->default('current'); // current, par1, par30, par60, par90
            $table->decimal('required_provision_pct', 5, 2)->default(0);
            $table->decimal('required_provision', 14, 2)->default(0);

            // Disbursement
            $table->string('disbursement_channel', 20)->nullable(); // cash, transfer, check
            $table->string('disbursement_bank', 80)->nullable();
            $table->string('disbursement_account', 40)->nullable();
            $table->string('disbursement_reference', 80)->nullable();
            $table->dateTime('disbursed_at')->nullable();

            // Workflow
            $table->string('status', 20)->default('pending');
            // pending -> committee_review -> approved -> disbursed -> current -> delinquent -> judicial | paid_off | written_off
            $table->string('purpose', 200)->nullable();
            $table->string('collection_zone', 80)->nullable();

            $table->dateTime('approved_at')->nullable();
            $table->dateTime('paid_off_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'advisor_id']);
            $table->index(['days_overdue', 'status']);
            $table->index(['client_id', 'status']);
        });
    }

    public function down(): void { Schema::dropIfExists('mf_loans'); }
};
