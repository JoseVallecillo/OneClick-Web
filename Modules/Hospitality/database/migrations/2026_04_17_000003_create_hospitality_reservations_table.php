<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hospitality_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained('contacts')->restrictOnDelete();
            $table->foreignId('room_id')->constrained('hospitality_rooms')->restrictOnDelete();
            $table->date('check_in_date');
            $table->date('check_out_date');
            $table->enum('status', ['draft', 'confirmed', 'checked_in', 'checked_out', 'cancelled'])->default('draft');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hospitality_reservations');
    }
};
