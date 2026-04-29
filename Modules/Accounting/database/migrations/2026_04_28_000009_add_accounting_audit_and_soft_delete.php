<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('entity_type'); // 'account', 'movement', 'budget', 'period', etc.
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('action'); // 'create', 'update', 'delete', 'post', 'close', etc.
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('reason')->nullable(); // Para reversiones
            $table->ipAddress()->nullable();
            $table->timestamp('created_at');

            $table->index(['user_id', 'entity_type']);
            $table->index(['entity_type', 'entity_id']);
            $table->index(['action', 'created_at']);
        });

        Schema::table('account_accounts', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('accounting_moves', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_audit_logs');
        Schema::table('account_accounts', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        Schema::table('accounting_moves', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
