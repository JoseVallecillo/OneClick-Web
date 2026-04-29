<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('barbershop_client_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->unique()->constrained('contacts')->cascadeOnDelete();
            $table->foreignId('preferred_barber_id')->nullable()->constrained('barbers')->nullOnDelete();
            $table->string('preferred_style', 200)->nullable();
            $table->unsignedInteger('total_visits')->default(0);
            $table->decimal('total_spent', 12, 2)->default(0);
            $table->timestamp('last_visit_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('barbershop_client_profiles');
    }
};
