<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── contacts ──────────────────────────────────────────────────────────
        Schema::table('contacts', function (Blueprint $table) {
            $table->index('name');
            $table->index('email');
            $table->index('active');
            $table->index(['is_client', 'is_supplier', 'is_employee']);

            // RTN único por empresa (null no cuenta como duplicado)
            $table->unique('rtn');
        });

        // ── contact_addresses ─────────────────────────────────────────────────
        Schema::table('contact_addresses', function (Blueprint $table) {
            // Compuesto: usado en setDefault() y búsquedas por tipo
            $table->index(['contact_id', 'type']);
        });

        // ── contact_persons ───────────────────────────────────────────────────
        Schema::table('contact_persons', function (Blueprint $table) {
            $table->index('contact_id');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            $table->dropIndex(['name']);
            $table->dropIndex(['email']);
            $table->dropIndex(['active']);
            $table->dropIndex(['is_client', 'is_supplier', 'is_employee']);
            $table->dropUnique(['rtn']);
        });

        Schema::table('contact_addresses', function (Blueprint $table) {
            $table->dropIndex(['contact_id', 'type']);
        });

        Schema::table('contact_persons', function (Blueprint $table) {
            $table->dropIndex(['contact_id']);
        });
    }
};
