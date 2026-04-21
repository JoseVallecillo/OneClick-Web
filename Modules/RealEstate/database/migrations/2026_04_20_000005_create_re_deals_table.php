<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('re_deals', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 20)->unique();
            $table->foreignId('property_id')->constrained('re_properties');
            $table->foreignId('lead_id')->nullable()->constrained('re_leads')->nullOnDelete();
            $table->foreignId('contact_id')->constrained('contacts');
            $table->enum('deal_type', ['sale', 'rent'])->default('sale');

            // Status workflow
            $table->enum('status', ['draft', 'reserved', 'documents', 'contract', 'closing', 'completed', 'cancelled'])->default('draft');

            // Reservation
            $table->decimal('reservation_amount', 14, 4)->default(0);
            $table->boolean('reservation_paid')->default(false);
            $table->date('reservation_date')->nullable();

            // Pricing
            $table->decimal('agreed_price', 14, 4)->nullable();
            $table->string('currency', 3)->default('HNL');
            $table->enum('rent_period', ['monthly', 'quarterly', 'yearly'])->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            // Contract
            $table->boolean('contract_generated')->default(false);
            $table->timestamp('contract_generated_at')->nullable();
            $table->boolean('contract_signed')->default(false);
            $table->timestamp('contract_signed_at')->nullable();

            $table->string('notes', 2000)->nullable();
            $table->string('internal_notes', 2000)->nullable();
            $table->string('cancellation_reason', 500)->nullable();

            $table->foreignId('agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('re_deals');
    }
};
