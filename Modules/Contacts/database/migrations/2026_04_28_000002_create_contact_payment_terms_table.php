<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_payment_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->string('term_name', 100);
            $table->integer('days_to_pay')->comment('Plazo en días');
            $table->boolean('is_default')->default(false);
            $table->decimal('early_payment_discount', 5, 2)->nullable()->comment('% descuento por pronto pago');
            $table->integer('discount_days')->nullable()->comment('Días para aplicar descuento');
            $table->decimal('late_payment_interest', 5, 2)->nullable()->comment('% interés por pago tarde');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_payment_terms');
    }
};
