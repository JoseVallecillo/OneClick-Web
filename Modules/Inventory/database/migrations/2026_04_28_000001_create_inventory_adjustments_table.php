<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_adjustments', function (Blueprint $table) {
            $table->id();

            $table->string('reference', 50)->unique();
            $table->date('adjustment_date');

            $table->foreignId('warehouse_id')->constrained('warehouses')->restrictOnDelete();

            $table->enum('type', ['recount', 'loss', 'damage', 'expiry', 'other'])->index();
            $table->text('reason')->nullable();

            $table->enum('state', ['draft', 'approved', 'posted'])->default('draft');

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->dateTime('approved_at')->nullable();

            $table->timestamps();
        });

        Schema::create('inventory_adjustment_lines', function (Blueprint $table) {
            $table->id();

            $table->foreignId('adjustment_id')->constrained('inventory_adjustments')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();

            $table->decimal('quantity_before', 15, 4);
            $table->decimal('quantity_after', 15, 4);
            $table->decimal('quantity_diff', 15, 4);

            $table->decimal('unit_cost', 15, 4)->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_adjustment_lines');
        Schema::dropIfExists('inventory_adjustments');
    }
};
