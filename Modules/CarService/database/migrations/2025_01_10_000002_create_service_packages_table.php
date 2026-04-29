<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Service Packages (combos/recipes) ────────────────────────────────────
        Schema::create('service_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);                         // e.g. "Cambio Aceite Sintético 5W-30"
            $table->text('description')->nullable();
            $table->enum('oil_type', ['mineral', 'semi_synthetic', 'synthetic'])->nullable();
            $table->string('oil_viscosity', 20)->nullable();     // e.g. 5W-30, 10W-40
            $table->decimal('base_price', 14, 4)->default(0);    // Reference price
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // ── Package Items (products/services included in a package) ───────────────
        Schema::create('service_package_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_package_id')->constrained('service_packages')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products');
            $table->decimal('qty', 10, 4)->default(1);
            $table->boolean('is_suggested')->default(false); // true = upsell suggestion
            $table->string('suggestion_reason', 200)->nullable(); // Why is this suggested?
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_package_items');
        Schema::dropIfExists('service_packages');
    }
};
