<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('autolote_vehicle_loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->unique()->constrained('autolote_vehicle_sales')->cascadeOnDelete();
            $table->decimal('monto_prestamo', 14, 4);
            $table->decimal('tasa_interes', 8, 4);
            $table->unsignedSmallInteger('plazo_meses');
            $table->decimal('cuota_mensual', 14, 4)->default(0);
            $table->date('fecha_inicio');
            $table->enum('estado', ['activo', 'cancelado', 'pagado'])->default('activo');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('autolote_vehicle_loans');
    }
};
