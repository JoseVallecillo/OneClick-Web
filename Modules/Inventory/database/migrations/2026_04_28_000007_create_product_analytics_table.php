<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_product_analytics', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();

            $table->decimal('total_sold_units', 15, 4)->default(0);
            $table->decimal('total_sold_value', 15, 2)->default(0);

            $table->decimal('average_monthly_sales', 15, 4)->default(0);
            $table->decimal('average_monthly_profit', 15, 2)->default(0);

            $table->decimal('stock_turnover_ratio', 8, 2)->default(0);
            $table->integer('days_inventory_outstanding')->default(0);

            $table->char('abc_classification', 1)->nullable();

            $table->dateTime('last_sold_at')->nullable();
            $table->integer('days_since_last_sale')->nullable();

            $table->enum('obsolescence_status', ['active', 'slow_moving', 'obsolete', 'discontinued'])->default('active');

            $table->dateTime('updated_at');
            $table->timestamps();

            $table->unique('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_product_analytics');
    }
};
