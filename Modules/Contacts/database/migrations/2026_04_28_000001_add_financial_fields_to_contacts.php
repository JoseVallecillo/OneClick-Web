<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->decimal('credit_limit', 12, 2)->nullable()->after('notes');
            $table->decimal('outstanding_balance', 12, 2)->default(0)->after('credit_limit');
            $table->decimal('total_purchases', 12, 2)->default(0)->after('outstanding_balance');
            $table->dateTime('last_purchase_date')->nullable()->after('total_purchases');
            $table->dateTime('last_payment_date')->nullable()->after('last_purchase_date');
            $table->string('preferred_contact_method')->nullable()->comment('email, phone, mobile, whatsapp')->after('last_payment_date');
            $table->string('preferred_language')->default('es')->after('preferred_contact_method');
            $table->boolean('is_tax_exempt')->default(false)->after('preferred_language');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropColumn([
                'credit_limit',
                'outstanding_balance',
                'total_purchases',
                'last_purchase_date',
                'last_payment_date',
                'preferred_contact_method',
                'preferred_language',
                'is_tax_exempt',
            ]);
        });
    }
};
