<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('license_tokens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('subscription_plans')->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('token', 64)->unique();          // HMAC-SHA256 hex (64 chars)
            $table->timestamp('expires_at');                // Cuándo expira el enlace de activación
            $table->timestamp('used_at')->nullable();       // Cuándo fue activado
            $table->enum('status', ['pending', 'used', 'expired', 'revoked'])->default('pending');
            $table->timestamps();

            $table->index(['token', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('license_tokens');
    }
};
