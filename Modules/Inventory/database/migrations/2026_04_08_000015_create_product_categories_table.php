<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);

            // Cuentas contables — strings por ahora, FK al módulo Contabilidad en el futuro
            $table->string('account_inventory', 50)->nullable(); // Activo: Inventario de Mercancías
            $table->string('account_income', 50)->nullable();    // Ingresos: Ventas
            $table->string('account_cogs', 50)->nullable();      // Gasto: Costo de Ventas

            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_categories');
    }
};
