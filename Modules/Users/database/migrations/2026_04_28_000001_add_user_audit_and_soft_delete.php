<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action'); // 'create', 'update_role', 'assign_profile', 'update_permissions', 'delete', 'restore'
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->ipAddress()->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('created_at');

            $table->index(['user_id', 'action']);
            $table->index(['performed_by', 'created_at']);
            $table->index(['action', 'created_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_audit_logs');
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
