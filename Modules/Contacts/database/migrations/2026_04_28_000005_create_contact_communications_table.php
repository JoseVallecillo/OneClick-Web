<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_communications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type')->comment('call, email, meeting, note');
            $table->string('subject')->nullable();
            $table->text('content');
            $table->dateTime('communication_date');
            $table->string('outcome')->nullable()->comment('positive, negative, neutral, follow_up_needed');
            $table->dateTime('follow_up_date')->nullable();
            $table->string('follow_up_type')->nullable()->comment('call, email, meeting');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_communications');
    }
};
