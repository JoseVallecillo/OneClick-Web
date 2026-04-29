<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_moves', function (Blueprint $table) {
            $table->id();

            // Auto-generated reference: AST-2026-0001
            $table->string('reference', 30)->unique();

            $table->foreignId('journal_id')->constrained('account_journals');

            // Entry date (accounting date, may differ from created_at)
            $table->date('date');

            $table->string('narration', 500)->nullable();

            // Workflow: draft → posted. A posted entry is immutable.
            // Cancellation is done via a reversal entry (reverse_of_id).
            $table->enum('state', ['draft', 'posted', 'cancelled'])->default('draft')->index();

            // If this is an auto-reversal, points to the original entry
            $table->foreignId('reverse_of_id')->nullable()->constrained('account_moves')->nullOnDelete();

            // Optional link to a source document in another module
            $table->string('source_document_type', 50)->nullable(); // e.g. "sales_order"
            $table->unsignedBigInteger('source_document_id')->nullable();

            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('posted_at')->nullable();

            $table->timestamps();

            $table->index(['date', 'state']);
            $table->index(['source_document_type', 'source_document_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_moves');
    }
};
