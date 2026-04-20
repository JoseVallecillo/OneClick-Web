<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('autolote_loan_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('autolote_vehicle_loans')->cascadeOnDelete();
            $table->unsignedSmallInteger('numero_cuota');
            $table->date('fecha_vencimiento');
            $table->date('fecha_pago')->nullable();
            $table->decimal('monto_cuota', 14, 4);
            $table->decimal('monto_capital', 14, 4);
            $table->decimal('monto_interes', 14, 4);
            $table->decimal('saldo_pendiente', 14, 4);
            $table->boolean('pagado')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('autolote_loan_payments');
    }
};
