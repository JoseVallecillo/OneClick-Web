<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('re_support_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 20)->unique();
            $table->foreignId('deal_id')->nullable()->constrained('re_deals')->nullOnDelete();
            $table->foreignId('property_id')->nullable()->constrained('re_properties')->nullOnDelete();
            $table->foreignId('contact_id')->constrained('contacts');
            $table->enum('type', ['warranty', 'repair', 'hidden_defect', 'maintenance', 'complaint', 'other'])->default('other');
            $table->string('title', 255);
            $table->text('description');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['open', 'in_progress', 'resolved', 'closed'])->default('open');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->text('resolution_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('re_support_tickets');
    }
};
