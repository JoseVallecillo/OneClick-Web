<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_moves', function (Blueprint $table) {
            $table->id();

            // initial    = carga inicial de inventario
            // in         = recepción de mercancía (compra)
            // out        = salida (venta, consumo)
            // adjust     = ajuste manual (robo, merma, corrección)
            // transfer_in  = entrada por transferencia entre almacenes
            // transfer_out = salida por transferencia entre almacenes
            $table->enum('type', ['initial', 'in', 'out', 'adjust', 'transfer_in', 'transfer_out']);

            $table->foreignId('warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignId('dest_warehouse_id')->nullable()   // solo en transferencias
                  ->constrained('warehouses')->restrictOnDelete();

            $table->string('reference', 100)->nullable(); // № OC, factura, ajuste…
            $table->text('notes')->nullable();

            // Enlaza transfer_out ↔ transfer_in del mismo movimiento
            $table->foreignId('related_move_id')->nullable()
                  ->constrained('stock_moves')->nullOnDelete();

            // Flag para el módulo Contabilidad (pendiente de contabilizar)
            $table->boolean('accounting_pending')->default(true);

            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('moved_at');
            $table->timestamps();

            $table->index(['type', 'warehouse_id']);
            $table->index('moved_at');
            $table->index('accounting_pending');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_moves');
    }
};
