<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_tables', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('number');
            $table->string('section', 60)->default('Interior');
            $table->enum('shape', ['square', 'circle'])->default('square');
            $table->unsignedTinyInteger('capacity')->default(4);
            $table->enum('status', ['available', 'occupied', 'pending_food'])->default('available');
            $table->string('server_name', 100)->nullable();
            $table->timestamp('opened_at')->nullable();
            $table->decimal('total', 14, 4)->default(0);
            $table->foreignId('pos_session_id')->nullable()->constrained('pos_sessions')->nullOnDelete();
            $table->unsignedBigInteger('current_sale_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_tables');
    }
};
