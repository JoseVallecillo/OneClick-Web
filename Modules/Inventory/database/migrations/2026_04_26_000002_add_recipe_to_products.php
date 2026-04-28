<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('has_recipe')->default(false)->after('active');
        });

        Schema::create('product_recipe_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained('products')->restrictOnDelete();
            $table->decimal('qty', 12, 4)->default(1);
            $table->timestamps();

            $table->unique(['product_id', 'ingredient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_recipe_lines');
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('has_recipe');
        });
    }
};
