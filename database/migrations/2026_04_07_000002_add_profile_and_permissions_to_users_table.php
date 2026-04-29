<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Relación con perfil base (nullable: usuarios existentes no tienen perfil aún)
            $table->foreignId('profile_id')
                ->nullable()
                ->after('remember_token')
                ->constrained('profiles')
                ->nullOnDelete();

            // Excepciones manuales que sobrescriben los permisos del perfil
            // ej. {"ventas.eliminar": true}  ← este usuario puede eliminar aunque su perfil diga false
            $table->json('permissions')->nullable()->after('profile_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['profile_id']);
            $table->dropColumn(['profile_id', 'permissions']);
        });
    }
};
