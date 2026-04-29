<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('re_payment_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('re_deals')->cascadeOnDelete();
            $table->enum('type', ['cash', 'installments', 'financing', 'mixed'])->default('installments');
            $table->decimal('total_amount', 14, 4);
            $table->decimal('down_payment', 14, 4)->default(0);
            $table->decimal('financed_amount', 14, 4)->default(0);
            $table->unsignedSmallInteger('installment_count')->default(1);
            $table->decimal('installment_amount', 14, 4)->default(0);
            $table->date('first_due_date')->nullable();
            $table->string('notes', 1000)->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('re_payment_installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_plan_id')->constrained('re_payment_plans')->cascadeOnDelete();
            $table->unsignedSmallInteger('number');
            $table->decimal('amount', 14, 4);
            $table->date('due_date');
            $table->enum('status', ['pending', 'paid', 'overdue', 'cancelled'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_reference', 100)->nullable();
            $table->string('invoice_number', 100)->nullable();
            $table->string('notes', 500)->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('re_payment_installments');
        Schema::dropIfExists('re_payment_plans');
    }
};
