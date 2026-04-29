<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('product_categories')->restrictOnDelete();
            $table->foreignId('uom_id')->constrained('units_of_measure')->restrictOnDelete();
            $table->foreignId('tax_rate_id')->nullable()->constrained('tax_rates')->nullOnDelete();

            $table->string('sku', 100)->unique();
            $table->string('name', 200);
            $table->text('description')->nullable();

            // storable = genera asientos de inventario
            // service  = va directo a ingresos, sin stock
            // consumable = se registra salida pero sin lotes
            $table->enum('type', ['storable', 'service', 'consumable'])->default('storable');

            // none   = sin trazabilidad
            // lot    = por lote (N unidades por lote)
            // serial = por número de serie (qty siempre = 1)
            $table->enum('tracking', ['none', 'lot', 'serial'])->default('none');

            // average = costo promedio ponderado (se actualiza automáticamente)
            // fifo    = primero en entrar, primero en salir (usa stock_lots)
            $table->enum('valuation', ['average', 'fifo'])->default('average');

            $table->decimal('cost', 12, 4)->default(0);   // costo promedio vigente
            $table->decimal('price', 12, 4)->default(0);  // precio de venta sugerido
            $table->decimal('min_stock', 10, 2)->default(0);

            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->index('category_id');
            $table->index('type');
            $table->index('active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
