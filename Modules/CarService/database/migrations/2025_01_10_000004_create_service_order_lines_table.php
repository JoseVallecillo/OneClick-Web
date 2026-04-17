<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_order_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_order_id')->constrained('service_orders')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();

            $table->string('description', 500)->nullable();  // Override or manual description
            $table->decimal('qty', 10, 4)->default(1);
            $table->decimal('unit_price', 14, 4)->default(0);
            $table->decimal('tax_rate', 6, 4)->default(0);  // e.g. 15.00 for 15%

            // Denormalized totals
            $table->decimal('subtotal', 14, 4)->default(0);
            $table->decimal('tax_amount', 14, 4)->default(0);
            $table->decimal('total', 14, 4)->default(0);

            // Upsell tracking
            $table->boolean('is_upsell')->default(false);
            $table->enum('upsell_type', ['brake_fluid', 'air_filter', 'cabin_filter', 'battery', 'other'])->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_order_lines');
    }
};
