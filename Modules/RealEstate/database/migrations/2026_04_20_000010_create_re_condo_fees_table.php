<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('re_condo_fees', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 20)->unique();
            $table->foreignId('property_id')->constrained('re_properties');
            $table->foreignId('contact_id')->constrained('contacts')->comment('Propietario o arrendatario responsable');
            $table->unsignedSmallInteger('period_year');
            $table->unsignedSmallInteger('period_month');
            $table->decimal('amount', 14, 4);
            $table->date('due_date');
            $table->enum('status', ['pending', 'paid', 'overdue', 'waived'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_reference', 100)->nullable();
            $table->string('invoice_number', 100)->nullable();
            $table->string('notes', 500)->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('re_condo_fees');
    }
};
