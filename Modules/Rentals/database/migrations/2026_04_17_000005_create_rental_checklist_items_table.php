<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_checklist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rental_checklist_id')->constrained('rental_checklists')->cascadeOnDelete();
            $table->foreignId('rental_order_line_id')->constrained('rental_order_lines')->cascadeOnDelete();
            $table->string('label', 255);
            $table->enum('condition', ['ok', 'damaged', 'missing'])->default('ok');
            $table->string('notes', 500)->nullable();
            $table->string('photo_path', 500)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_checklist_items');
    }
};
