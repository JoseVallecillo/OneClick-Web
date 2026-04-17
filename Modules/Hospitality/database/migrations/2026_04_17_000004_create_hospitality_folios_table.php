<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hospitality_folios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reservation_id')->unique()->constrained('hospitality_reservations')->cascadeOnDelete();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('isv_amount', 12, 2)->default(0);       // 15% ISV Honduras
            $table->decimal('tourism_tax_amount', 12, 2)->default(0); // 4% Tourism Tax
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->enum('payment_status', ['pending', 'partial', 'paid'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hospitality_folios');
    }
};
