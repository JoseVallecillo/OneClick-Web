<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('re_lead_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('re_leads')->cascadeOnDelete();
            $table->enum('type', ['call', 'email', 'visit', 'whatsapp', 'meeting', 'other'])->default('call');
            $table->string('subject', 255)->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('interaction_at');
            $table->foreignId('user_id')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('re_lead_interactions');
    }
};
