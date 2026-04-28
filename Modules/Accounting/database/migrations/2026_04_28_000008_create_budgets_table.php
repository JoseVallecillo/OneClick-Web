<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_budgets', function (Blueprint $table) {
            $table->id();

            $table->string('name', 150);
            $table->text('description')->nullable();

            $table->date('date_from');
            $table->date('date_to');

            $table->enum('status', ['draft', 'approved', 'active', 'closed'])->default('draft');

            $table->timestamps();
        });

        Schema::create('account_budget_lines', function (Blueprint $table) {
            $table->id();

            $table->foreignId('budget_id')->constrained('account_budgets')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('account_accounts')->restrictOnDelete();

            $table->decimal('budgeted_amount', 15, 2);
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique(['budget_id', 'account_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_budget_lines');
        Schema::dropIfExists('account_budgets');
    }
};
