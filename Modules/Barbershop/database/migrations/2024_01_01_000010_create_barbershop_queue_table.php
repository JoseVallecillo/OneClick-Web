<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barbershop_queue', function (Blueprint $table) {
            $table->id();
            $table->date('queue_date');
            $table->unsignedSmallInteger('position');
            $table->string('client_name', 150);
            $table->string('client_phone', 30)->nullable();
            $table->foreignId('barber_id')->nullable()->constrained('barbers')->nullOnDelete();
            $table->string('status', 20)->default('waiting');
            // waiting | called | in_service | done | skipped
            $table->text('notes')->nullable();
            $table->timestamp('arrived_at')->nullable();
            $table->timestamp('called_at')->nullable();
            $table->timestamp('done_at')->nullable();
            $table->foreignId('appointment_id')->nullable()->constrained('barbershop_appointments')->nullOnDelete();
            $table->timestamps();

            $table->index(['queue_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barbershop_queue');
    }
};
