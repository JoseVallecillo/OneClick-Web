<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_transfers', function (Blueprint $table) {
            $table->id();

            $table->string('reference', 50)->unique();
            $table->date('transfer_date');

            $table->foreignId('warehouse_from_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignId('warehouse_to_id')->constrained('warehouses')->restrictOnDelete();

            $table->text('reason')->nullable();

            $table->enum('state', ['draft', 'in_transit', 'received', 'cancelled'])->default('draft');

            $table->dateTime('shipped_at')->nullable();
            $table->dateTime('received_at')->nullable();

            $table->timestamps();
        });

        Schema::create('inventory_transfer_lines', function (Blueprint $table) {
            $table->id();

            $table->foreignId('transfer_id')->constrained('inventory_transfers')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();

            $table->decimal('quantity_shipped', 15, 4)->default(0);
            $table->decimal('quantity_received', 15, 4)->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transfer_lines');
        Schema::dropIfExists('inventory_transfers');
    }
};
