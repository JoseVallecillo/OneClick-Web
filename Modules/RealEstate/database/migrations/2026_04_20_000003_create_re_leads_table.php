<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('re_leads', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 20)->unique();
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->string('name', 255);
            $table->string('phone', 50)->nullable();
            $table->string('email', 255)->nullable();

            // Interest profile
            $table->enum('deal_type', ['sale', 'rent', 'both'])->default('sale');
            $table->enum('property_type', ['apartment', 'house', 'land', 'commercial', 'office', 'warehouse', 'any'])->default('any');
            $table->decimal('budget_min', 14, 4)->nullable();
            $table->decimal('budget_max', 14, 4)->nullable();
            $table->string('preferred_zone', 255)->nullable();
            $table->unsignedSmallInteger('bedrooms_min')->default(0);
            $table->unsignedSmallInteger('bathrooms_min')->default(0);

            // Pipeline
            $table->enum('status', ['new', 'contacted', 'qualified', 'proposal', 'negotiating', 'won', 'lost'])->default('new');
            $table->enum('source', ['referral', 'web', 'social', 'direct', 'portal', 'other'])->default('direct');
            $table->string('notes', 2000)->nullable();

            $table->foreignId('agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('re_leads');
    }
};
