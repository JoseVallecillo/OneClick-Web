<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('autolote_vehicle_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->unique()->constrained('autolote_vehicles')->cascadeOnDelete();
            $table->foreignId('buyer_id')->constrained('contacts');
            $table->decimal('precio_venta', 14, 4);
            $table->decimal('descuento', 14, 4)->default(0);
            $table->enum('tipo_pago', ['contado', 'credito_propio', 'financiamiento_externo'])->default('contado');
            $table->foreignId('vehicle_permuta_id')->nullable()->constrained('autolote_vehicles')->nullOnDelete();
            $table->decimal('valor_permuta', 14, 4)->default(0);
            $table->date('fecha_venta');
            $table->text('notas')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('autolote_vehicle_sales');
    }
};
