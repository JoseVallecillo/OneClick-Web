<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('mf_loan_products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('code', 20)->unique();
            $table->string('loan_type', 20)->default('individual'); // individual, group
            $table->string('currency', 3)->default('HNL');

            // Interest
            $table->decimal('annual_rate', 6, 2); // e.g. 48.00%
            $table->string('rate_calculation', 20)->default('flat'); // flat, declining

            // Fees
            $table->string('origination_fee_type', 10)->default('flat'); // flat, pct
            $table->decimal('origination_fee_value', 10, 2)->default(0);
            $table->decimal('insurance_pct', 5, 4)->default(0); // % of balance per period

            // Late fees
            $table->string('late_fee_type', 10)->default('daily_pct'); // fixed_daily, daily_pct
            $table->decimal('late_fee_value', 8, 4)->default(0);

            // Term
            $table->string('payment_frequency', 20)->default('weekly'); // weekly, biweekly, monthly
            $table->integer('min_term_payments')->default(4);
            $table->integer('max_term_payments')->default(52);

            // Amounts
            $table->decimal('min_amount', 12, 2)->default(1000);
            $table->decimal('max_amount', 12, 2)->default(100000);

            // Cycle limits JSON: [{cycle:1, max_amount:5000},{cycle:2, max_amount:10000},...]
            // null = no cycle limit progression
            $table->json('cycle_limits')->nullable();

            // Group solidarity threshold (days overdue to block group)
            $table->integer('group_block_days')->default(3);

            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void { Schema::dropIfExists('mf_loan_products'); }
};
