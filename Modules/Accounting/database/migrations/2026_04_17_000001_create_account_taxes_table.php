<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_taxes', function (Blueprint $table) {
            $table->id();

            $table->string('name', 100);           // e.g. "ISV 15%", "ISV 18%", "Exento"
            $table->string('code', 20)->unique();  // e.g. "ISV15", "ISV18", "EXE"

            $table->enum('type', ['percentage', 'fixed', 'exempt'])->default('percentage');

            // Rate as a decimal: 15.00, 18.00, 0.00
            $table->decimal('rate', 6, 2)->default(0);

            // Applies to sales-side or purchase-side (or both)
            $table->enum('tax_scope', ['sales', 'purchases', 'all'])->default('all');

            // Accounts that collect/pay this tax — stored as plain bigint to avoid
            // circular FK dependency with account_accounts (added via seeders/config).
            $table->unsignedBigInteger('tax_account_id')->nullable();
            $table->unsignedBigInteger('refund_account_id')->nullable();

            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_taxes');
    }
};
