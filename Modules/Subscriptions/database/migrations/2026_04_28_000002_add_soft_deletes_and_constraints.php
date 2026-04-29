<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->softDeletes();
            $table->unique(['company_id', 'is_active'], 'unique_active_subscription_per_company')
                ->where('is_active', true);
        });

        Schema::table('license_tokens', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropUnique('unique_active_subscription_per_company');
        });

        Schema::table('license_tokens', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
