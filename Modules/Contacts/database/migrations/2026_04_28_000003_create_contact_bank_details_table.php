<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_bank_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->string('bank_name', 200);
            $table->string('account_type')->comment('checking, savings, credit_line');
            $table->string('account_number', 100);
            $table->string('account_holder', 200)->nullable();
            $table->string('swift_code', 20)->nullable();
            $table->string('iban', 50)->nullable();
            $table->string('routing_number', 50)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_bank_details');
    }
};
