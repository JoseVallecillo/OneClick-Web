<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();        // USD, HNL, EUR…
            $table->string('name');                      // Dólar, Lempira, Euro…
            $table->string('symbol', 10);                // $, L, €…
            $table->decimal('exchange_rate', 15, 6)->default(1); // tasa vs moneda principal
            $table->boolean('is_primary')->default(false);       // solo una puede ser principal
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('currencies');
    }
};
