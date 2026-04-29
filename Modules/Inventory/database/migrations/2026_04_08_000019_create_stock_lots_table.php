<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();

            $table->string('lot_number', 100);      // código de lote o número de serie
            $table->date('expiration_date')->nullable();
            $table->decimal('qty_available', 10, 2)->default(0); // siempre 0|1 para serials
            $table->decimal('unit_cost', 12, 4)->default(0);
            $table->date('received_at');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Un número de lote es único por producto + almacén
            $table->unique(['product_id', 'warehouse_id', 'lot_number']);
            $table->index(['product_id', 'warehouse_id']);
            $table->index('expiration_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_lots');
    }
};
