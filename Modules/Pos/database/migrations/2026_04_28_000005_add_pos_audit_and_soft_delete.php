<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('entity_type'); // 'sale', 'session', 'discount', 'refund', 'cancellation'
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('action'); // 'create', 'cancel', 'refund', 'open_session', 'close_session'
            $table->decimal('amount', 12, 2)->nullable();
            $table->json('details')->nullable();
            $table->string('reason')->nullable();
            $table->ipAddress()->nullable();
            $table->timestamp('created_at');

            $table->index(['user_id', 'entity_type']);
            $table->index(['entity_type', 'entity_id']);
            $table->index(['action', 'created_at']);
        });

        Schema::table('pos_sales', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('pos_sessions', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_audit_logs');
        Schema::table('pos_sales', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        Schema::table('pos_sessions', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
