<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_kitchen_tickets', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pos_order_id')->constrained('pos_orders')->cascadeOnDelete();

            $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending')->index();

            $table->text('special_notes')->nullable();

            $table->dateTime('printed_at')->nullable();
            $table->dateTime('started_at')->nullable();
            $table->dateTime('completed_at')->nullable();

            $table->timestamps();
        });

        Schema::create('pos_kitchen_ticket_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('kitchen_ticket_id')->constrained('pos_kitchen_tickets')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();

            $table->decimal('qty', 15, 4);
            $table->text('special_instructions')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_kitchen_ticket_items');
        Schema::dropIfExists('pos_kitchen_tickets');
    }
};
