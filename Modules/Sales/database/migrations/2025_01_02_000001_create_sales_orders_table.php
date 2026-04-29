<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->id();

            // Auto-generated reference: VT-2025-0001
            $table->string('reference', 20)->unique();

            // Customer (contact with is_client = true)
            $table->foreignId('customer_id')->constrained('contacts');

            // Source warehouse (where goods will be dispatched from)
            $table->foreignId('warehouse_id')->constrained('warehouses');

            // Currency for the order
            $table->foreignId('currency_id')->constrained('currencies');

            // Workflow status: quote → confirmed → shipped → invoiced
            $table->enum('status', ['quote', 'confirmed', 'shipped', 'invoiced'])->default('quote');

            // B2B-specific fields
            $table->string('customer_po_ref', 100)->nullable();  // Customer's own PO number
            $table->string('payment_terms', 50)->nullable();     // net30, net60, immediate, etc.

            // Dates per workflow step
            $table->date('delivery_date')->nullable();           // Expected delivery date
            $table->date('quote_expires_at')->nullable();        // Quote expiration date
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('invoiced_at')->nullable();

            // Invoice info (filled at invoiced step)
            $table->string('invoice_number', 100)->nullable();
            $table->date('invoice_date')->nullable();
            $table->date('invoice_due_date')->nullable();

            // Totals (denormalized for performance)
            $table->decimal('subtotal', 14, 4)->default(0);
            $table->decimal('tax_amount', 14, 4)->default(0);
            $table->decimal('total', 14, 4)->default(0);

            // Link to the StockMove created on shipment
            $table->foreignId('stock_move_id')->nullable()->constrained('stock_moves');

            $table->text('notes')->nullable();

            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_orders');
    }
};
