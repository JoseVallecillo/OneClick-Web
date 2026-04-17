<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('commercial_name');                       // Nombre comercial
            $table->string('legal_name')->nullable();                // Razón social
            $table->string('tax_id')->nullable();                    // RTN / NIT
            $table->string('legal_representative')->nullable();      // Representante legal
            $table->string('logo_light')->nullable();                // Ruta PNG/JPG/SVG — tema claro
            $table->string('logo_dark')->nullable();                 // Ruta PNG/JPG/SVG — tema oscuro
            $table->string('logo_pdf')->nullable();                  // Ruta PNG alta resolución para PDFs
            $table->string('currency', 10)->default('HNL');         // Moneda principal
            $table->string('timezone')->default('America/Tegucigalpa');
            $table->string('date_format', 20)->default('d/m/Y');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
