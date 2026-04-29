<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('entity_type'); // 'product', 'stock', 'transfer', 'adjustment'
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('action'); // 'create', 'update', 'adjust_stock', 'transfer'
            $table->decimal('quantity_change', 12, 2)->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->text('reason')->nullable();
            $table->ipAddress()->nullable();
            $table->timestamp('created_at');

            $table->index(['user_id', 'entity_type']);
            $table->index(['entity_type', 'entity_id']);
            $table->index(['action', 'created_at']);
        });

        Schema::table('inventory_products', function (Blueprint $table) {
            $table->softDeletes();
        });

        Schema::table('inventory_transfers', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_audit_logs');
        Schema::table('inventory_products', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
        Schema::table('inventory_transfers', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
