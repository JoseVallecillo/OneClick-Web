<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();

            // Auto-generated reference: OC-2025-0001
            $table->string('reference', 20)->unique();

            // Supplier (contact with is_supplier = true)
            $table->foreignId('supplier_id')->constrained('contacts');

            // Destination warehouse (where goods will be received)
            $table->foreignId('warehouse_id')->constrained('warehouses');

            // Currency for the order
            $table->foreignId('currency_id')->constrained('currencies');

            // Workflow status
            $table->enum('status', ['draft', 'confirmed', 'received', 'invoiced'])->default('draft');

            // Dates per workflow step
            $table->date('expected_date')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('invoiced_at')->nullable();

            // Supplier invoice info (filled at invoiced step)
            $table->string('invoice_number', 100)->nullable();
            $table->date('invoice_date')->nullable();
            $table->date('invoice_due_date')->nullable();

            // Totals (denormalized for performance)
            $table->decimal('subtotal', 14, 4)->default(0);
            $table->decimal('tax_amount', 14, 4)->default(0);
            $table->decimal('total', 14, 4)->default(0);

            // Link to the StockMove created on receive
            $table->foreignId('stock_move_id')->nullable()->constrained('stock_moves');

            $table->text('notes')->nullable();

            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
