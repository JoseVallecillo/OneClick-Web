<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('re_commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('re_deals')->cascadeOnDelete();
            $table->foreignId('agent_id')->constrained('users');
            $table->decimal('commission_pct', 5, 2)->default(0);
            $table->decimal('base_amount', 14, 4);
            $table->decimal('commission_amount', 14, 4);
            $table->enum('status', ['pending', 'approved', 'paid', 'cancelled'])->default('pending');
            $table->string('notes', 1000)->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_reference', 100)->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('re_commissions');
    }
};
