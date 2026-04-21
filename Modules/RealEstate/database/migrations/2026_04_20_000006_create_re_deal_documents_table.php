<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('re_deal_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('deal_id')->constrained('re_deals')->cascadeOnDelete();
            $table->enum('type', ['dni', 'income_proof', 'tax_id', 'bank_statement', 'contract', 'other'])->default('other');
            $table->string('name', 255);
            $table->string('path', 500);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->string('notes', 500)->nullable();
            $table->foreignId('uploaded_by')->constrained('users');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('re_deal_documents');
    }
};
