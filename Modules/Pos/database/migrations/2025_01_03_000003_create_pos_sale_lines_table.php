<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_sale_lines', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pos_sale_id')->constrained('pos_sales')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');

            $table->string('description', 500)->nullable();

            $table->decimal('qty', 14, 2)->default(1);
            $table->decimal('unit_price', 14, 4)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);

            // Calculated totals (denormalized)
            $table->decimal('subtotal', 14, 4)->default(0);
            $table->decimal('tax_amount', 14, 4)->default(0);
            $table->decimal('total', 14, 4)->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_sale_lines');
    }
};
