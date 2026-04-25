<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barbershop_service_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('color', 7)->default('#6366f1');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barbershop_service_categories');
    }
};
