<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->string('document_type')->comment('contract, invoice, quote, agreement');
            $table->string('document_name', 300);
            $table->string('file_path');
            $table->string('file_type', 50);
            $table->bigInteger('file_size');
            $table->dateTime('document_date')->nullable();
            $table->dateTime('expiry_date')->nullable();
            $table->string('status')->default('active')->comment('active, expired, archived');
            $table->text('notes')->nullable();
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_documents');
    }
};
