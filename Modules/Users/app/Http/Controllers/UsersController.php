<?php

namespace Modules\Users\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Settings\Models\Company;
use Modules\Subscriptions\Services\SubscriptionService;

class UsersController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $users = User::with('profile:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'profile_id', 'permissions', 'email_verified_at', 'created_at']);

        $profiles = Profile::withCount('users')
            ->orderBy('name')
            ->get();

        return Inertia::render('Users::Index', [
            'users'    => $users,
            'profiles' => $profiles,
        ]);
    }

    // ── User management ────────────────────────────────────────────────────────

    public function storeUser(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);

        // Verificar límite de usuarios según el plan de suscripción activo
        if (class_exists(SubscriptionService::class) && class_exists(Company::class)) {
            $company = Company::first();
            if ($company) {
                $canAdd = rescue(
                    fn () => app(SubscriptionService::class)->canAddUser($company),
                    true, // Si el módulo falla, no bloqueamos
                );

                if (! $canAdd) {
                    return back()->withErrors([
                        'email' => 'Has alcanzado el límite de usuarios permitidos por tu plan de suscripción actual.',
                    ]);
                }
            }
        }

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email',
            'password' => ['required', Password::defaults()],
            'role'     => 'required|in:admin,user',
        ]);

        User::create([
            'name'              => $validated['name'],
            'email'             => $validated['email'],
            'password'          => Hash::make($validated['password']),
            'role'              => $validated['role'],
            'email_verified_at' => now(),
        ]);

        return back()->with('success', 'Usuario creado correctamente.');
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->preventSelfAction($request, $user, 'No puedes cambiar tu propio rol.');

        $validated = $request->validate([
            'role' => 'required|in:admin,user',
        ]);

        $user->update(['role' => $validated['role']]);

        return back()->with('success', 'Rol actualizado correctamente.');
    }

    public function assignProfile(Request $request, User $user): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'profile_id' => 'nullable|exists:profiles,id',
        ]);

        $user->update(['profile_id' => $validated['profile_id']]);

        return back()->with('success', 'Perfil asignado correctamente.');
    }

    public function updateExceptions(Request $request, User $user): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'permissions'   => 'nullable|array',
            'permissions.*' => 'boolean',
        ]);

        $user->update(['permissions' => $validated['permissions'] ?: null]);

        return back()->with('success', 'Excepciones guardadas correctamente.');
    }

    public function deleteUser(Request $request, User $user): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->preventSelfAction($request, $user, 'No puedes eliminar tu propia cuenta.');

        $user->delete();

        return back()->with('success', 'Usuario eliminado correctamente.');
    }

    // ── Profile management ─────────────────────────────────────────────────────

    public function storeProfile(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'name'          => 'required|string|max:100|unique:profiles,name',
            'permissions'   => 'nullable|array',
            'permissions.*' => 'boolean',
        ]);

        Profile::create([
            'name'        => $validated['name'],
            'permissions' => $validated['permissions'] ?: null,
        ]);

        return back()->with('success', 'Perfil creado correctamente.');
    }

    public function updateProfile(Request $request, Profile $profile): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'name'          => 'required|string|max:100|unique:profiles,name,' . $profile->id,
            'permissions'   => 'nullable|array',
            'permissions.*' => 'boolean',
        ]);

        $profile->update([
            'name'        => $validated['name'],
            'permissions' => $validated['permissions'] ?: null,
        ]);

        return back()->with('success', 'Perfil actualizado correctamente.');
    }

    public function deleteProfile(Request $request, Profile $profile): RedirectResponse
    {
        $this->requireAdmin($request);

        // Desvincula usuarios antes de eliminar
        $profile->users()->update(['profile_id' => null]);
        $profile->delete();

        return back()->with('success', 'Perfil eliminado. Los usuarios asignados quedaron sin perfil.');
    }

}
