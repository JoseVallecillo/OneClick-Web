<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_fixed_assets', function (Blueprint $table) {
            $table->id();

            $table->string('code', 20)->unique();
            $table->string('name', 150);
            $table->text('description')->nullable();

            $table->foreignId('account_id')->constrained('account_accounts')->restrictOnDelete();

            $table->decimal('acquisition_cost', 15, 2);
            $table->date('acquisition_date');

            $table->enum('depreciation_method', ['straight_line', 'accelerated', 'units_of_production'])->default('straight_line');
            $table->integer('useful_life_years');
            $table->decimal('residual_value', 15, 2)->default(0);

            $table->decimal('accumulated_depreciation', 15, 2)->default(0);
            $table->date('last_depreciation_date')->nullable();

            $table->enum('status', ['active', 'retired', 'sold'])->default('active');
            $table->dateTime('retired_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_fixed_assets');
    }
};
