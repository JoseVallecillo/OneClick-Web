<?php

namespace Modules\Users\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Settings\Models\Company;
use Modules\Subscriptions\Services\SubscriptionService;
use Modules\Users\Services\UserAuditService;
use Modules\Users\Validators\PermissionValidator;

class UsersController extends Controller
{
    /** User creation rate limit (requests per hour). */
    private const USER_CREATION_RATE_LIMIT = 50;

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

        $deletedCount = User::onlyTrashed()->count();

        return Inertia::render('Users::Index', [
            'users'        => $users,
            'profiles'     => $profiles,
            'deletedCount' => $deletedCount,
        ]);
    }

    // ── User management ────────────────────────────────────────────────────────

    public function storeUser(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);

        $cacheKey = "users:creation_attempts:{$request->user()->id}";
        $attempts = (int) Cache::get($cacheKey, 0);

        if ($attempts >= self::USER_CREATION_RATE_LIMIT) {
            return back()->withErrors([
                'email' => 'Has alcanzado el límite de creación de usuarios. Intenta más tarde.',
            ]);
        }

        if (class_exists(SubscriptionService::class) && class_exists(Company::class)) {
            $company = Company::first();
            if ($company) {
                try {
                    $canAdd = app(SubscriptionService::class)->canAddUser($company);
                    if (!$canAdd) {
                        return back()->withErrors([
                            'email' => 'Has alcanzado el límite de usuarios permitidos por tu plan de suscripción actual.',
                        ]);
                    }
                } catch (\Exception $e) {
                    return back()->withErrors([
                        'email' => 'Error al verificar límite de usuarios. Contacta al soporte.',
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

        $user = User::create([
            'name'              => $validated['name'],
            'email'             => $validated['email'],
            'password'          => Hash::make($validated['password']),
            'role'              => $validated['role'],
            'email_verified_at' => now(),
        ]);

        UserAuditService::logUserCreation($user, $request->user(), $request);

        Cache::put($cacheKey, $attempts + 1, now()->addHours(1));

        return back()->with('success', 'Usuario creado correctamente.');
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->preventSelfAction($request, $user, 'No puedes cambiar tu propio rol.');

        $validated = $request->validate([
            'role' => 'required|in:admin,user',
        ]);

        $oldRole = $user->role;
        $user->update(['role' => $validated['role']]);

        UserAuditService::logRoleUpdate($user, $oldRole, $validated['role'], $request->user(), $request);

        return back()->with('success', 'Rol actualizado correctamente.');
    }

    public function assignProfile(Request $request, User $user): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'profile_id' => 'nullable|exists:profiles,id',
        ]);

        $oldProfileId = $user->profile_id;
        $user->update(['profile_id' => $validated['profile_id']]);

        UserAuditService::logProfileAssignment($user, $oldProfileId, $validated['profile_id'], $request->user(), $request);

        return back()->with('success', 'Perfil asignado correctamente.');
    }

    public function updateExceptions(Request $request, User $user): RedirectResponse
    {
        $this->requireAdmin($request);

        $validated = $request->validate([
            'permissions'   => 'nullable|array',
            'permissions.*' => 'boolean',
        ]);

        $permissions = $validated['permissions'] ?: null;

        if (!PermissionValidator::validate($permissions)) {
            return back()->withErrors([
                'permissions' => 'Contiene permisos inválidos.',
            ]);
        }

        $oldPermissions = $user->permissions;
        $user->update(['permissions' => $permissions]);

        UserAuditService::logPermissionsUpdate($user, $oldPermissions, $permissions, $request->user(), $request);

        return back()->with('success', 'Excepciones guardadas correctamente.');
    }

    public function deleteUser(Request $request, User $user): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->preventSelfAction($request, $user, 'No puedes eliminar tu propia cuenta.');

        UserAuditService::logUserDeletion($user, $request->user(), $request);
        $user->delete();

        return back()->with('success', 'Usuario eliminado correctamente.');
    }

    public function restoreUser(Request $request, int $userId): RedirectResponse
    {
        $this->requireAdmin($request);

        $user = User::withTrashed()->findOrFail($userId);

        if (!$user->trashed()) {
            return back()->withErrors(['user' => 'El usuario no está eliminado.']);
        }

        $user->restore();

        UserAuditService::logUserRestoration($user, $request->user(), $request);

        return back()->with('success', 'Usuario restaurado correctamente.');
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

    public function updatePosCatalogPreference(Request $request, User $user)
    {
        if ($request->user()->id !== $user->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'pos_catalog_view' => 'required|in:cards,table',
        ]);

        $user->update(['pos_catalog_view' => $validated['pos_catalog_view']]);

        return response()->json(['success' => true]);
    }

}
