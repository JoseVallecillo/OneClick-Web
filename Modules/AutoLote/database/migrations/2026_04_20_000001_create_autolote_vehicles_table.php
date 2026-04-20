<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('autolote_vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('vin', 50)->nullable()->unique();
            $table->string('placa', 20)->nullable()->unique();
            $table->string('motor', 50)->nullable();
            $table->string('marca', 80);
            $table->string('modelo', 80);
            $table->unsignedSmallInteger('anio');
            $table->string('color', 50)->nullable();
            $table->enum('transmision', ['manual', 'automatica', 'cvt', 'otro'])->default('manual');
            $table->unsignedInteger('kilometraje')->default(0);
            $table->unsignedTinyInteger('num_duenos_anteriores')->default(0);
            $table->boolean('gravamen')->default(false);
            $table->enum('estado_aduana', ['nacional', 'en_tramite', 'importado', 'exonerado'])->default('nacional');
            $table->enum('estado', ['recepcion', 'preparacion', 'exhibicion', 'apartado', 'vendido'])->default('recepcion');
            $table->decimal('precio_compra', 14, 4)->default(0);
            $table->decimal('costo_total', 14, 4)->default(0);
            $table->foreignId('vendedor_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->text('notas')->nullable();
            $table->date('received_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('autolote_vehicles');
    }
};
