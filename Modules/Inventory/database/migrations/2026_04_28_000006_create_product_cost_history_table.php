<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_product_cost_history', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();

            $table->decimal('cost', 15, 4);
            $table->decimal('price', 15, 4);

            $table->dateTime('effective_from');
            $table->dateTime('effective_to')->nullable();

            $table->enum('reason', ['purchase', 'adjustment', 'revaluation', 'other'])->default('other');
            $table->text('notes')->nullable();

            $table->unsignedBigInteger('changed_by')->nullable();

            $table->timestamps();

            $table->index(['product_id', 'effective_from']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_product_cost_history');
    }
};
