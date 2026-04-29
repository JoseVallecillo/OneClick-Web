<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_reorder_suggestions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->restrictOnDelete();

            $table->decimal('current_stock', 15, 4);
            $table->decimal('min_stock', 15, 4);
            $table->decimal('reorder_point', 15, 4);
            $table->decimal('suggested_quantity', 15, 4);

            $table->decimal('average_monthly_usage', 15, 4)->nullable();
            $table->decimal('lead_time_days', 8, 2)->nullable();

            $table->enum('status', ['pending', 'ordered', 'received', 'dismissed'])->default('pending');

            $table->dateTime('dismissed_at')->nullable();
            $table->text('dismissal_reason')->nullable();

            $table->timestamps();

            $table->unique(['product_id', 'warehouse_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_reorder_suggestions');
    }
};
