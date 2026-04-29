<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_analytical_accounts', function (Blueprint $table) {
            $table->id();

            $table->string('code', 20)->unique();
            $table->string('name', 150);
            $table->text('description')->nullable();

            // Link to a main accounting account for aggregation
            $table->foreignId('account_id')->nullable()->constrained('account_accounts')->nullOnDelete();

            // Hierarchical structure: parent analytical account
            $table->foreignId('parent_id')->nullable()->constrained('account_analytical_accounts')->nullOnDelete();

            // Only leaf accounts accept direct journal entries
            $table->boolean('is_leaf')->default(true);

            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_analytical_accounts');
    }
};
