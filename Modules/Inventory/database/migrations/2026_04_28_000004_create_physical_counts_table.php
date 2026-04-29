<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_physical_counts', function (Blueprint $table) {
            $table->id();

            $table->string('reference', 50)->unique();
            $table->date('count_date');

            $table->foreignId('warehouse_id')->constrained('warehouses')->restrictOnDelete();

            $table->text('notes')->nullable();

            $table->enum('state', ['draft', 'in_progress', 'completed', 'reconciled'])->default('draft');

            $table->dateTime('completed_at')->nullable();
            $table->dateTime('reconciled_at')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();

            $table->timestamps();
        });

        Schema::create('inventory_count_lines', function (Blueprint $table) {
            $table->id();

            $table->foreignId('count_id')->constrained('inventory_physical_counts')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();

            $table->decimal('system_quantity', 15, 4);
            $table->decimal('counted_quantity', 15, 4)->nullable();
            $table->decimal('variance', 15, 4)->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_count_lines');
        Schema::dropIfExists('inventory_physical_counts');
    }
};
