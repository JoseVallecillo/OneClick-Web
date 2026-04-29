<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_sales', function (Blueprint $table) {
            $table->id();

            // Auto-generated reference: RV-2025-0001 (Recibo de Venta)
            $table->string('reference', 20)->unique();

            // Session this sale belongs to
            $table->foreignId('pos_session_id')->constrained('pos_sessions');

            // Optional customer (B2C is mostly anonymous)
            $table->foreignId('customer_id')->nullable()->constrained('contacts');

            // Currency (inherited from session)
            $table->foreignId('currency_id')->constrained('currencies');

            // Sale status
            $table->enum('status', ['completed', 'voided'])->default('completed');

            // Payment
            $table->enum('payment_method', ['cash', 'card', 'transfer'])->default('cash');
            $table->decimal('amount_tendered', 14, 4)->default(0);  // Amount given by customer
            $table->decimal('change_given', 14, 4)->default(0);     // Change returned

            // Totals
            $table->decimal('subtotal', 14, 4)->default(0);
            $table->decimal('tax_amount', 14, 4)->default(0);
            $table->decimal('total', 14, 4)->default(0);

            // Link to the StockMove (out) created on this sale
            $table->foreignId('stock_move_id')->nullable()->constrained('stock_moves');

            $table->text('notes')->nullable();

            $table->timestamp('voided_at')->nullable();
            $table->foreignId('voided_by')->nullable()->constrained('users');

            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_sales');
    }
};
