<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barbershop_clients', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('phone', 30)->nullable();
            $table->string('email', 150)->nullable();
            $table->date('birthdate')->nullable();
            $table->string('preferred_style', 200)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('preferred_barber_id')->nullable()->constrained('barbers')->nullOnDelete();
            $table->unsignedInteger('total_visits')->default(0);
            $table->decimal('total_spent', 12, 2)->default(0);
            $table->timestamp('last_visit_at')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barbershop_clients');
    }
};
