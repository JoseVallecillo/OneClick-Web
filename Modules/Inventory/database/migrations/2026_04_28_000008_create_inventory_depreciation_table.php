<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_depreciation_records', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->restrictOnDelete();

            $table->date('depreciation_date');

            $table->decimal('quantity_depreciated', 15, 4);
            $table->decimal('unit_cost', 15, 4);
            $table->decimal('total_depreciation_value', 15, 2);

            $table->enum('reason', ['obsolete', 'damaged', 'expired', 'loss', 'other'])->default('other');
            $table->text('notes')->nullable();

            $table->enum('state', ['draft', 'approved', 'posted'])->default('draft');

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->dateTime('approved_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_depreciation_records');
    }
};
