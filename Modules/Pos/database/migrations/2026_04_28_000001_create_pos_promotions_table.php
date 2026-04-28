<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_promotions', function (Blueprint $table) {
            $table->id();

            $table->string('code', 50)->unique();
            $table->string('name', 150);
            $table->text('description')->nullable();

            $table->enum('type', ['fixed', 'percentage', 'bogo'])->index();
            $table->decimal('discount_value', 15, 4);

            $table->dateTime('valid_from');
            $table->dateTime('valid_to')->nullable();

            $table->integer('max_uses')->nullable();
            $table->integer('current_uses')->default(0);

            $table->boolean('active')->default(true);

            $table->timestamps();
        });

        Schema::create('pos_promotion_products', function (Blueprint $table) {
            $table->id();

            $table->foreignId('promotion_id')->constrained('pos_promotions')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();

            $table->timestamps();

            $table->unique(['promotion_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_promotion_products');
        Schema::dropIfExists('pos_promotions');
    }
};
