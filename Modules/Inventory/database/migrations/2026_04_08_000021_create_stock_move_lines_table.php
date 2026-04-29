<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_move_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_move_id')->constrained('stock_moves')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();

            // Null para productos con tracking = none
            $table->foreignId('lot_id')->nullable()
                  ->constrained('stock_lots')->restrictOnDelete();

            $table->decimal('qty', 10, 2);
            $table->decimal('unit_cost', 12, 4)->default(0);
            $table->decimal('total_cost', 14, 4)->storedAs('qty * unit_cost');
            $table->timestamps();

            $table->index(['stock_move_id', 'product_id']);
            $table->index('lot_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_move_lines');
    }
};
