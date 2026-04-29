<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_audit_logs', function (Blueprint $table) {
            $table->id();

            $table->string('entity_type', 100);
            $table->unsignedBigInteger('entity_id');

            $table->enum('action', ['create', 'update', 'delete', 'post', 'reverse'])->index();

            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();

            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('user_email', 100)->nullable();

            $table->text('reason')->nullable();

            $table->string('ip_address', 45)->nullable();

            $table->timestamps();

            $table->index(['entity_type', 'entity_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_audit_logs');
    }
};
