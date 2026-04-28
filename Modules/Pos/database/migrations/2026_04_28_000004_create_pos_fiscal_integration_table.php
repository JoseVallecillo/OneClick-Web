<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_fiscal_documents', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pos_sale_id')->constrained('pos_sales')->restrictOnDelete();

            $table->string('fiscal_number', 50)->unique()->nullable();
            $table->string('authorization_code', 100)->nullable();

            $table->enum('status', ['pending', 'authorized', 'failed', 'cancelled'])->default('pending')->index();

            $table->dateTime('authorized_at')->nullable();
            $table->text('error_message')->nullable();

            $table->json('sar_response')->nullable();

            $table->timestamps();
        });

        Schema::create('pos_receipt_prints', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pos_sale_id')->constrained('pos_sales')->restrictOnDelete();

            $table->enum('printer_type', ['receipt', 'kitchen', 'custom'])->default('receipt');
            $table->string('printer_name', 100)->nullable();

            $table->dateTime('printed_at');
            $table->integer('reprint_count')->default(0);

            $table->unsignedBigInteger('printed_by')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_receipt_prints');
        Schema::dropIfExists('pos_fiscal_documents');
    }
};
