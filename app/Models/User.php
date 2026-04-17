<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['name', 'email', 'password', 'profile_id', 'permissions'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    protected function casts(): array
    {
        return [
            'email_verified_at'      => 'datetime',
            'password'               => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'permissions'            => 'array',
        ];
    }

    // ── Relaciones ────────────────────────────────────────────────────────────

    public function profile(): BelongsTo
    {
        return $this->belongsTo(Profile::class);
    }

    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(\Modules\Settings\Models\Branch::class, 'branch_user');
    }

    // ── Permisos ──────────────────────────────────────────────────────────────

    /**
     * Combina los permisos del perfil con las excepciones del usuario.
     * Las llaves del usuario tienen prioridad sobre las del perfil.
     *
     * Ejemplo:
     *   perfil:    ["ventas.crear" => true,  "ventas.eliminar" => false]
     *   usuario:   ["ventas.eliminar" => true]        ← excepción manual
     *   resultado: ["ventas.crear" => true,  "ventas.eliminar" => true]
     *
     * @return Attribute<array<string, bool>, never>
     */
    protected function allPermissions(): Attribute
    {
        return Attribute::make(
            get: function (): array {
                $profilePermissions = $this->profile?->permissions ?? [];
                $userPermissions    = $this->permissions ?? [];

                // array_merge: si una llave existe en ambos, el último (usuario) gana
                return array_merge($profilePermissions, $userPermissions);
            },
        );
    }

    /**
     * Comprueba si el usuario tiene activo un permiso concreto.
     *
     * Uso:  $user->hasPermission('ventas.crear')
     *
     * Devuelve false si la llave no existe en ninguno de los dos JSONs
     * (ausencia de permiso = denegado por defecto).
     */
    public function hasPermission(string $key): bool
    {
        return (bool) ($this->all_permissions[$key] ?? false);
    }
}

