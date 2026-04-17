<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_order_lines', function (Blueprint $table) {
            $table->id();

            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');

            // Optional override description (defaults to product name)
            $table->string('description', 500)->nullable();

            // Quantities
            $table->decimal('qty', 12, 2);
            $table->decimal('qty_received', 12, 2)->default(0);

            // Pricing
            $table->decimal('unit_cost', 14, 4);
            $table->decimal('tax_rate', 5, 2)->default(0);  // percentage 0–100

            // Computed totals (stored for performance)
            $table->decimal('subtotal', 14, 4)->default(0);
            $table->decimal('tax_amount', 14, 4)->default(0);
            $table->decimal('total', 14, 4)->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_lines');
    }
};
