<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('governance_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('action'); // 'approve', 'reject', 'pin_attempt', etc.
            $table->string('module_name')->nullable();
            $table->string('element_identifier')->nullable();
            $table->string('token')->nullable();
            $table->json('details')->nullable();
            $table->ipAddress()->nullable();
            $table->timestamp('created_at');

            $table->index(['user_id', 'action']);
            $table->index(['action', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('governance_audit_logs');
    }
};
