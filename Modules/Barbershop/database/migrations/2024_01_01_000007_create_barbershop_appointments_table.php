<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barbershop_appointments', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 20)->unique();
            $table->foreignId('client_id')->nullable()->constrained('barbershop_clients')->nullOnDelete();
            $table->string('client_name', 150);
            $table->string('client_phone', 30)->nullable();
            $table->foreignId('barber_id')->nullable()->constrained('barbers')->nullOnDelete();
            $table->date('appointment_date');
            $table->time('start_time');
            $table->time('end_time');
            $table->string('status', 20)->default('pending');
            // pending | confirmed | in_progress | completed | cancelled | no_show
            $table->string('source', 20)->default('manual');
            // manual | walk_in | online
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total', 10, 2)->default(0);
            $table->string('payment_method', 30)->nullable();
            $table->string('payment_status', 20)->default('pending');
            // pending | paid | partial | refunded
            $table->timestamp('checked_in_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['appointment_date', 'status']);
            $table->index(['barber_id', 'appointment_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barbershop_appointments');
    }
};
