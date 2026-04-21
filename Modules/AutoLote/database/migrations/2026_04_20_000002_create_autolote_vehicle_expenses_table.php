<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('autolote_vehicle_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained('autolote_vehicles')->cascadeOnDelete();
            $table->enum('tipo', ['mecanica', 'pintura', 'lavado', 'tapiceria', 'electrico', 'otro'])->default('otro');
            $table->string('descripcion', 255);
            $table->decimal('monto', 14, 4);
            $table->date('fecha');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('autolote_vehicle_expenses');
    }
};
