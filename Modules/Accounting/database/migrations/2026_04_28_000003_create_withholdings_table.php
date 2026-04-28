<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_withholdings', function (Blueprint $table) {
            $table->id();

            $table->string('code', 20)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();

            $table->enum('type', ['income', 'sales_tax', 'purchase_tax', 'other'])->index();
            $table->enum('scope', ['sales', 'purchases', 'all'])->default('all');

            $table->decimal('rate', 6, 2)->default(0);

            $table->unsignedBigInteger('account_id')->nullable();
            $table->unsignedBigInteger('payable_account_id')->nullable();

            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_withholdings');
    }
};
