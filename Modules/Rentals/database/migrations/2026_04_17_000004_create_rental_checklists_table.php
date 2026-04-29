<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_checklists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rental_order_id')->constrained('rental_orders')->cascadeOnDelete();
            $table->enum('type', ['delivery', 'return']);
            $table->foreignId('technician_id')->constrained('users');
            $table->enum('overall_condition', ['excellent', 'good', 'fair', 'poor'])->default('good');
            $table->string('notes', 2000)->nullable();
            $table->timestamps();

            $table->unique(['rental_order_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_checklists');
    }
};
