<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_sessions', function (Blueprint $table) {
            $table->id();

            // Auto-generated reference: TP-2025-0001 (Terminal POS)
            $table->string('reference', 20)->unique();

            // Name/label for this session (e.g., "Caja 1 - Mañana")
            $table->string('name', 100)->nullable();

            // Source warehouse for stock movements
            $table->foreignId('warehouse_id')->constrained('warehouses');

            // Operating currency
            $table->foreignId('currency_id')->constrained('currencies');

            // Session status
            $table->enum('status', ['open', 'closed'])->default('open');

            // Cash management
            $table->decimal('opening_balance', 14, 4)->default(0);  // Cash in drawer at start
            $table->decimal('closing_balance', 14, 4)->nullable();   // Cash counted at close

            // Totals (denormalized, updated as sales come in)
            $table->decimal('total_sales', 14, 4)->default(0);       // Sum of all sale totals
            $table->decimal('total_cash', 14, 4)->default(0);        // Cash payments received
            $table->decimal('total_card', 14, 4)->default(0);        // Card payments received
            $table->decimal('total_transfer', 14, 4)->default(0);    // Transfer payments received
            $table->integer('sales_count')->default(0);              // Number of completed sales
            $table->integer('voided_count')->default(0);             // Number of voided sales

            $table->timestamp('opened_at')->nullable();
            $table->timestamp('closed_at')->nullable();

            $table->text('notes')->nullable();

            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_sessions');
    }
};
