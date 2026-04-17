<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('name', 150);
            $table->string('code', 20);             // WH-MAIN, WH-SEC…
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['branch_id', 'code']);
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warehouses');
    }
};
