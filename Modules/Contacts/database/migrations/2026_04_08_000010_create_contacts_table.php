<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);                        // nombre comercial o nombre completo
            $table->string('legal_name', 200)->nullable();      // razón social
            $table->string('rtn', 20)->nullable();              // RTN Honduras (14 dígitos)
            $table->string('dni', 15)->nullable();              // Documento Nacional de Identidad
            $table->string('email', 200)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('mobile', 30)->nullable();
            $table->string('website', 200)->nullable();
            $table->boolean('is_client')->default(false);
            $table->boolean('is_supplier')->default(false);
            $table->boolean('is_employee')->default(false);
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contacts');
    }
};
