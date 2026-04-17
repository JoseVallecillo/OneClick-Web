<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->decimal('hourly_price', 12, 4)->default(0);
            $table->decimal('daily_price', 12, 4)->default(0);
            $table->decimal('weekly_price', 12, 4)->default(0);
            $table->decimal('monthly_price', 12, 4)->default(0);
            $table->decimal('deposit_amount', 12, 4)->default(0);
            $table->unsignedInteger('buffer_hours_before')->default(0);
            $table->unsignedInteger('buffer_hours_after')->default(0);
            $table->unsignedInteger('maintenance_limit_days')->nullable();
            $table->string('notes', 500)->nullable();
            $table->timestamps();

            $table->unique('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_rates');
    }
};
