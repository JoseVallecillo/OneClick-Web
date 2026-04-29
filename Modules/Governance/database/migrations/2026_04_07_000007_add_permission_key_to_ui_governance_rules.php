<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ui_governance_rules', function (Blueprint $table) {
            // Opcional: llave de permiso del sistema de Profiles.
            // Si está definida, la regla solo aplica a usuarios que NO tengan ese permiso.
            // Esto permite control individual por perfil además del control por rol.
            // ej. 'ventas.eliminar' → oculta el botón a quien no tenga ese permiso en su perfil
            $table->string('permission_key')->nullable()->after('user_role')
                ->comment('If set, rule applies only to users lacking this permission key.');
        });
    }

    public function down(): void
    {
        Schema::table('ui_governance_rules', function (Blueprint $table) {
            $table->dropColumn('permission_key');
        });
    }
};
