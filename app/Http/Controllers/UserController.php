<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

/**
 * Ejemplos de uso del sistema de perfiles y permisos.
 *
 * ESTRUCTURA DEL JSON DE PERMISOS
 * ─────────────────────────────────────────────────────────────────────────────
 * Llaves planas con notación de punto. El valor es siempre booleano.
 *
 *   [
 *     "ventas.crear"    => true,
 *     "ventas.editar"   => true,
 *     "ventas.eliminar" => false,
 *     "reportes.ver"    => true,
 *     "admin.usuarios"  => false,
 *   ]
 *
 * CREAR UN PERFIL
 * ─────────────────────────────────────────────────────────────────────────────
 *   $perfil = Profile::create([
 *       'name' => 'Vendedor',
 *       'permissions' => [
 *           'ventas.crear'    => true,
 *           'ventas.editar'   => true,
 *           'ventas.eliminar' => false,
 *           'reportes.ver'    => true,
 *       ],
 *   ]);
 *
 * ASIGNAR UN PERFIL A UN USUARIO
 * ─────────────────────────────────────────────────────────────────────────────
 *   $user->update(['profile_id' => $perfil->id]);
 *
 *   // O cargando la relación directamente:
 *   $user->profile()->associate($perfil)->save();
 *
 * GUARDAR UNA EXCEPCIÓN MANUAL EN EL USUARIO
 * ─────────────────────────────────────────────────────────────────────────────
 * El perfil "Vendedor" prohíbe ventas.eliminar, pero este usuario en
 * particular sí debe poder hacerlo:
 *
 *   $user->update([
 *       'permissions' => [
 *           'ventas.eliminar' => true,   // ← sobreescribe al perfil
 *       ],
 *   ]);
 *
 * RESULTADO DEL ACCESSOR all_permissions
 * ─────────────────────────────────────────────────────────────────────────────
 *   // Perfil base:
 *   //   "ventas.crear" => true, "ventas.eliminar" => false
 *   // Usuario (excepción):
 *   //   "ventas.eliminar" => true
 *
 *   $user->all_permissions;
 *   // => ["ventas.crear" => true, "ventas.eliminar" => true]
 *
 * VERIFICAR UN PERMISO
 * ─────────────────────────────────────────────────────────────────────────────
 *   $user->hasPermission('ventas.crear')    // true
 *   $user->hasPermission('ventas.eliminar') // true  (excepción del usuario)
 *   $user->hasPermission('admin.usuarios')  // false (no existe = denegado)
 *
 * ENVIAR A INERTIA (preparado para el frontend)
 * ─────────────────────────────────────────────────────────────────────────────
 *   return Inertia::render('MiPagina', [
 *       'permissions' => $request->user()->all_permissions,
 *       // El frontend recibe: {"ventas.crear": true, "ventas.eliminar": true, ...}
 *   ]);
 *
 *   // O si prefieres verificar en el backend antes de renderizar:
 *   if (! $request->user()->hasPermission('ventas.crear')) {
 *       abort(403);
 *   }
 */
class UserController extends Controller
{
    /**
     * Asigna un perfil a un usuario y opcionalmente guarda excepciones manuales.
     * Ejemplo real de cómo usar el sistema en un controlador.
     */
    public function assignProfile(Request $request, User $user): \Illuminate\Http\RedirectResponse
    {
        if (($request->user()->role ?? 'user') !== 'admin') {
            abort(403, 'Solo los administradores pueden asignar perfiles.');
        }

        $validated = $request->validate([
            'profile_id'  => 'required|exists:profiles,id',
            'permissions' => 'nullable|array',              // excepciones manuales
            'permissions.*' => 'boolean',                   // cada valor debe ser bool
        ]);

        $user->update([
            'profile_id'  => $validated['profile_id'],
            'permissions' => $validated['permissions'] ?? null,
        ]);

        return back()->with('success', 'Perfil actualizado correctamente.');
    }
}
