<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();

            // Identification
            $table->string('plate', 20)->unique();           // License plate (primary key for lookup)
            $table->string('vin', 17)->nullable()->unique(); // Vehicle Identification Number

            // Vehicle data (can be populated from API or manually)
            $table->string('make', 80);                      // Brand: Toyota, Ford, etc.
            $table->string('model', 80);                     // Model: Hilux, F-150, etc.
            $table->smallInteger('year')->nullable();        // Year: 2020
            $table->string('color', 50)->nullable();         // Color
            $table->string('engine', 50)->nullable();        // Engine: 2.4L, 1.6L, etc.
            $table->string('transmission', 20)->nullable();  // manual / automatic / cvt

            // Owner
            $table->foreignId('customer_id')->nullable()->constrained('contacts')->nullOnDelete();

            // Tracking
            $table->integer('last_odometer')->default(0);    // Last known odometer (km)
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
