<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_maintenances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products');
            $table->foreignId('lot_id')->nullable()->constrained('stock_lots')->nullOnDelete();
            $table->enum('maintenance_type', ['preventive', 'corrective'])->default('preventive');
            $table->enum('status', ['scheduled', 'in_progress', 'completed', 'cancelled'])->default('scheduled');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('usage_days_at_trigger')->nullable();
            $table->string('description', 1000)->nullable();
            $table->string('resolution_notes', 1000)->nullable();
            $table->decimal('cost', 12, 4)->default(0);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_maintenances');
    }
};
