<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('re_properties', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 20)->unique();
            $table->enum('type', ['apartment', 'house', 'land', 'commercial', 'office', 'warehouse'])->default('apartment');
            $table->enum('status', ['available', 'reserved', 'sold', 'rented', 'maintenance', 'inactive'])->default('available');
            $table->string('title', 255);
            $table->text('description')->nullable();

            // Location
            $table->string('address', 500)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('zone', 150)->nullable();
            $table->string('department', 100)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            // Technical specs
            $table->decimal('land_area', 10, 2)->nullable()->comment('m2 de terreno');
            $table->decimal('build_area', 10, 2)->nullable()->comment('m2 de construcción');
            $table->unsignedSmallInteger('bedrooms')->default(0);
            $table->unsignedSmallInteger('bathrooms')->default(0);
            $table->unsignedSmallInteger('parking_spots')->default(0);
            $table->unsignedSmallInteger('floors')->default(1);
            $table->enum('soil_type', ['residential', 'commercial', 'industrial', 'agricultural', 'mixed'])->nullable();

            // Services
            $table->boolean('has_water')->default(false);
            $table->boolean('has_electricity')->default(false);
            $table->boolean('has_gas')->default(false);
            $table->boolean('has_internet')->default(false);
            $table->boolean('has_sewage')->default(false);

            // Pricing
            $table->decimal('sale_price', 14, 4)->nullable();
            $table->decimal('rent_price', 14, 4)->nullable();
            $table->string('currency', 3)->default('HNL');

            // Assignment
            $table->foreignId('agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->string('notes', 2000)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('re_properties');
    }
};
