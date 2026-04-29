<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->integer('quality_rating')->comment('1-5');
            $table->integer('delivery_rating')->comment('1-5');
            $table->integer('communication_rating')->comment('1-5');
            $table->integer('price_rating')->comment('1-5');
            $table->decimal('on_time_delivery_percent', 5, 2)->default(0)->comment('% de entregas a tiempo');
            $table->decimal('defect_rate', 5, 2)->default(0)->comment('% de productos defectuosos');
            $table->integer('average_delivery_days')->nullable();
            $table->dateTime('last_evaluation_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_evaluations');
    }
};
