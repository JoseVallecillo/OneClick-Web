<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_returns', function (Blueprint $table) {
            $table->id();

            $table->string('reference', 50)->unique();
            $table->date('return_date');

            $table->string('source_type', 50)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();

            $table->enum('reason', ['defective', 'wrong_item', 'customer_request', 'expired', 'other'])->index();
            $table->text('notes')->nullable();

            $table->enum('state', ['draft', 'approved', 'received', 'processed'])->default('draft');

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->dateTime('approved_at')->nullable();

            $table->timestamps();
        });

        Schema::create('inventory_return_lines', function (Blueprint $table) {
            $table->id();

            $table->foreignId('return_id')->constrained('inventory_returns')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();

            $table->decimal('quantity', 15, 4);
            $table->decimal('unit_price', 15, 4)->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_return_lines');
        Schema::dropIfExists('inventory_returns');
    }
};
