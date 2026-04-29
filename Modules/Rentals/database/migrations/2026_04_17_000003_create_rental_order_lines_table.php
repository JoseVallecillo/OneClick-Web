<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_order_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rental_order_id')->constrained('rental_orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('lot_id')->nullable()->constrained('stock_lots')->nullOnDelete();
            $table->string('description', 500)->nullable();
            $table->decimal('qty', 10, 2)->default(1);
            $table->enum('rate_type', ['hourly', 'daily', 'weekly', 'monthly'])->default('daily');
            $table->decimal('unit_price', 12, 4)->default(0);
            $table->decimal('duration', 10, 2)->default(1);
            $table->decimal('discount_pct', 5, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('subtotal', 14, 4)->default(0);
            $table->decimal('tax_amount', 14, 4)->default(0);
            $table->decimal('total', 14, 4)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_order_lines');
    }
};
