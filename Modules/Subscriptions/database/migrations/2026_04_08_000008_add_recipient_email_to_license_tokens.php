<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('license_tokens', function (Blueprint $table) {
            $table->string('recipient_email')->after('created_by');
        });
    }

    public function down(): void
    {
        Schema::table('license_tokens', function (Blueprint $table) {
            $table->dropColumn('recipient_email');
        });
    }
};
