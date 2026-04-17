<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 20)->unique();
            $table->foreignId('customer_id')->constrained('contacts');
            $table->enum('status', ['draft', 'confirmed', 'active', 'returned', 'invoiced', 'closed'])->default('draft');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('pickup_type', ['local', 'delivery'])->default('local');
            $table->string('delivery_address', 500)->nullable();
            $table->decimal('deposit_amount', 12, 4)->default(0);
            $table->enum('deposit_status', ['none', 'pending', 'held', 'released', 'applied'])->default('none');
            $table->string('deposit_notes', 500)->nullable();
            $table->boolean('contract_signed')->default(false);
            $table->timestamp('signed_at')->nullable();
            $table->decimal('subtotal', 14, 4)->default(0);
            $table->decimal('tax_amount', 14, 4)->default(0);
            $table->decimal('total', 14, 4)->default(0);
            $table->decimal('damage_charges', 14, 4)->default(0);
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('returned_at')->nullable();
            $table->timestamp('invoiced_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->string('invoice_number', 100)->nullable();
            $table->string('notes', 2000)->nullable();
            $table->string('internal_notes', 2000)->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_orders');
    }
};
