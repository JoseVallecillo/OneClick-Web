<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('entity_type'); // 'po', 'quote', 'receipt', 'return'
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('action'); // 'create', 'update', 'confirm', 'receive', 'cancel'
            $table->decimal('amount', 12, 2)->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('reason')->nullable();
            $table->ipAddress()->nullable();
            $table->timestamp('created_at');

            $table->index(['user_id', 'entity_type']);
            $table->index(['entity_type', 'entity_id']);
            $table->index(['action', 'created_at']);
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases_audit_logs');
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
