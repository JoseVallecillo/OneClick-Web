<?php

namespace Modules\Governance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Governance\Models\GovernanceAuditLog;
use Modules\Governance\Models\GovernanceAuthRequest;
use Modules\Governance\Models\GovernanceFieldValidator;
use Modules\Governance\Models\UiGovernanceRule;
use Nwidart\Modules\Facades\Module;

class GovernanceController extends Controller
{
    /** Authorization requests expire after this many minutes. */
    private const AUTH_EXPIRY_MINUTES = 5;

    /** PIN lockout resets after this many minutes. */
    private const PIN_LOCKOUT_TTL_MINUTES = 15;

    /** Authorization check rate limit per token (requests per minute). */
    private const AUTH_CHECK_RATE_LIMIT = 60;

    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $modules = collect(Module::allEnabled())->map(fn ($m) => $m->getName())->values();

        $rules = UiGovernanceRule::orderBy('module_name')
            ->orderBy('element_identifier')
            ->get()
            ->makeVisible('pin_code');

        $pendingRequests = GovernanceAuthRequest::with('user:id,name,email')
            ->where('status', 'pending')
            ->latest()
            ->get();

        $fieldValidators = GovernanceFieldValidator::orderBy('module_name')
            ->orderBy('field_identifier')
            ->get();

        return Inertia::render('Governance::Index', [
            'modules'         => $modules,
            'rules'           => $rules,
            'pendingRequests' => $pendingRequests,
            'fieldValidators' => $fieldValidators,
        ]);
    }

    public function addRule(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);

        $enabledModules = collect(Module::allEnabled())->map(fn ($m) => $m->getName())->values()->toArray();

        $validated = $request->validate([
            'module_name'        => ['required', 'string', 'max:100', 'in:' . implode(',', $enabledModules)],
            'element_identifier' => 'required|string|max:200',
            'action_type'        => 'required|in:hide,pin,authorize',
            'user_role'          => 'nullable|string|in:admin,user',
            'permission_key'     => 'nullable|string|max:200',
            'pin_code'           => 'nullable|string|max:10',
            'max_pin_attempts'   => 'nullable|integer|min:1|max:10',
            'active'             => 'boolean',
        ]);

        if ($validated['action_type'] === 'pin' && empty($validated['pin_code'])) {
            return back()->withErrors(['pin_code' => 'Se requiere código PIN para el tipo de acción "pin".']);
        }

        UiGovernanceRule::updateOrCreate(
            [
                'module_name'        => $validated['module_name'],
                'element_identifier' => $validated['element_identifier'],
            ],
            [
                'action_type'      => $validated['action_type'],
                'user_role'        => $validated['user_role'] ?? null,
                'permission_key'   => $validated['permission_key'] ?? null,
                'pin_code'         => $validated['pin_code'] ?? null,
                'max_pin_attempts' => $validated['max_pin_attempts'] ?? 3,
                'active'           => $validated['active'] ?? true,
            ]
        );

        return back()->with('success', 'Regla de gobierno guardada.');
    }

    public function toggleRule(Request $request, UiGovernanceRule $rule): RedirectResponse
    {
        $this->requireAdmin($request);
        $rule->update(['active' => ! $rule->active]);

        return back()->with('success', 'Regla actualizada.');
    }

    public function deleteRule(Request $request, UiGovernanceRule $rule): RedirectResponse
    {
        $this->requireAdmin($request);
        $rule->delete();

        return back()->with('success', 'Regla eliminada.');
    }

    /**
     * Validate a PIN — tracks attempts per user/element with Cache.
     * Returns: { valid, locked, attempts_left }
     */
    public function checkPin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'element_identifier' => 'required|string',
            'module_name'        => 'required|string',
            'pin'                => 'required|string',
        ]);

        $user     = $request->user();
        $userRole = $user?->role ?? 'user';

        $rule = UiGovernanceRule::where('module_name', $validated['module_name'])
            ->where('element_identifier', $validated['element_identifier'])
            ->where('action_type', 'pin')
            ->where('active', true)
            ->where(function ($q) use ($userRole) {
                $q->whereNull('user_role')->orWhere('user_role', $userRole);
            })
            ->first();

        if (! $rule) {
            return response()->json(['valid' => true, 'locked' => false, 'attempts_left' => null]);
        }

        $cacheKey    = "governance:pin_attempts:{$user->id}:{$validated['module_name']}:{$validated['element_identifier']}";
        $maxAttempts = $rule->max_pin_attempts;
        $attempts    = (int) Cache::get($cacheKey, 0);

        // Already locked
        if ($attempts >= $maxAttempts) {
            return response()->json([
                'valid'        => false,
                'locked'       => true,
                'attempts_left' => 0,
            ]);
        }

        if (hash_equals((string) $rule->pin_code, $validated['pin'])) {
            Cache::forget($cacheKey);

            GovernanceAuditLog::create([
                'user_id'            => $user->id,
                'action'             => 'pin_success',
                'module_name'        => $validated['module_name'],
                'element_identifier' => $validated['element_identifier'],
                'details'            => ['user_role' => $userRole],
                'ip_address'         => request()->ip(),
                'created_at'         => now(),
            ]);

            return response()->json([
                'valid'        => true,
                'locked'       => false,
                'attempts_left' => null,
            ]);
        }

        $newAttempts = $attempts + 1;
        Cache::put($cacheKey, $newAttempts, now()->addMinutes(self::PIN_LOCKOUT_TTL_MINUTES));

        GovernanceAuditLog::create([
            'user_id'            => $user->id,
            'action'             => 'pin_failure',
            'module_name'        => $validated['module_name'],
            'element_identifier' => $validated['element_identifier'],
            'details'            => [
                'user_role'    => $userRole,
                'attempt'      => $newAttempts,
                'max_attempts' => $maxAttempts,
            ],
            'ip_address'         => request()->ip(),
            'created_at'         => now(),
        ]);

        return response()->json([
            'valid'        => false,
            'locked'       => $newAttempts >= $maxAttempts,
            'attempts_left' => max(0, $maxAttempts - $newAttempts),
        ]);
    }

    /**
     * Create a pending authorization request with expiry timestamp.
     * Returns: { token, expires_at }
     */
    public function requestAuthorization(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'element_identifier' => 'required|string',
            'module_name'        => 'required|string',
        ]);

        $expiresAt   = now()->addMinutes(self::AUTH_EXPIRY_MINUTES);
        $authRequest = GovernanceAuthRequest::create([
            'user_id'            => $request->user()->id,
            'module_name'        => $validated['module_name'],
            'element_identifier' => $validated['element_identifier'],
            'token'              => Str::uuid()->toString(),
            'status'             => 'pending',
            'expires_at'         => $expiresAt,
        ]);

        return response()->json([
            'token'      => $authRequest->token,
            'expires_at' => $expiresAt->toISOString(),
        ]);
    }

    /**
     * Poll endpoint — auto-expires if time is up, returns current status.
     * Rate limited to prevent brute force attacks.
     */
    public function checkAuthorization(string $token): JsonResponse
    {
        $cacheKey = "governance:check_auth_attempts:{$token}";
        $attempts = (int) Cache::get($cacheKey, 0);

        if ($attempts >= self::AUTH_CHECK_RATE_LIMIT) {
            return response()->json(['status' => 'rate_limited'], 429);
        }

        Cache::put($cacheKey, $attempts + 1, now()->addMinutes(1));

        $authRequest = GovernanceAuthRequest::where('token', $token)->firstOrFail();

        if ($authRequest->status === 'pending' && $authRequest->isExpired()) {
            $authRequest->update(['status' => 'expired']);
        }

        return response()->json(['status' => $authRequest->status]);
    }

    public function approveAuthorization(Request $request, string $token): RedirectResponse
    {
        $this->requireAdmin($request);

        $authRequest = GovernanceAuthRequest::where('token', $token)->firstOrFail();

        if ($authRequest->isExpired()) {
            return back()->with('error', 'This authorization request has already expired.');
        }

        $authRequest->update(['status' => 'approved']);

        GovernanceAuditLog::create([
            'user_id'            => $request->user()->id,
            'action'             => 'approve_authorization',
            'module_name'        => $authRequest->module_name,
            'element_identifier' => $authRequest->element_identifier,
            'token'              => $token,
            'details'            => [
                'approved_by_email' => $request->user()->email,
                'requested_by'      => $authRequest->user_id,
            ],
            'ip_address'         => $request->ip(),
            'created_at'         => now(),
        ]);

        return back()->with('success', 'Authorization approved.');
    }

    public function rejectAuthorization(Request $request, string $token): RedirectResponse
    {
        $this->requireAdmin($request);

        $authRequest = GovernanceAuthRequest::where('token', $token)->firstOrFail();
        $authRequest->update(['status' => 'rejected']);

        GovernanceAuditLog::create([
            'user_id'            => $request->user()->id,
            'action'             => 'reject_authorization',
            'module_name'        => $authRequest->module_name,
            'element_identifier' => $authRequest->element_identifier,
            'token'              => $token,
            'details'            => [
                'rejected_by_email' => $request->user()->email,
                'requested_by'      => $authRequest->user_id,
            ],
            'ip_address'         => $request->ip(),
            'created_at'         => now(),
        ]);

        return back()->with('success', 'Authorization rejected.');
    }

    // ── Field Validators ──────────────────────────────────────────────────────

    public function addFieldValidator(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);

        $enabledModules = collect(Module::allEnabled())->map(fn ($m) => $m->getName())->values()->toArray();

        $validated = $request->validate([
            'module_name'      => ['required', 'string', 'max:100', 'in:' . implode(',', $enabledModules)],
            'field_identifier' => 'required|string|max:200',
            'validation_type'  => 'required|in:numeric,alpha,alpha-dash,alphanumeric',
            'user_role'        => 'nullable|string|in:admin,user',
            'active'           => 'boolean',
        ]);

        GovernanceFieldValidator::updateOrCreate(
            [
                'module_name'      => $validated['module_name'],
                'field_identifier' => $validated['field_identifier'],
            ],
            [
                'validation_type' => $validated['validation_type'],
                'user_role'       => $validated['user_role'] ?? null,
                'active'          => $validated['active'] ?? true,
            ]
        );

        return back()->with('success', 'Field validator saved.');
    }

    public function toggleFieldValidator(Request $request, GovernanceFieldValidator $validator): RedirectResponse
    {
        $this->requireAdmin($request);
        $validator->update(['active' => ! $validator->active]);

        return back()->with('success', 'Field validator updated.');
    }

    public function deleteFieldValidator(Request $request, GovernanceFieldValidator $validator): RedirectResponse
    {
        $this->requireAdmin($request);
        $validator->delete();

        return back()->with('success', 'Field validator deleted.');
    }

    /**
     * Discovery endpoint: returns models and their fields for a given module.
     * Used by the dynamic selects in the Governance panel.
     * Results are cached for 24 hours.
     */
    public function getModuleElements(Request $request, string $moduleName): JsonResponse
    {
        $this->requireAdmin($request);

        $cacheKey = "governance:module_elements:{$moduleName}";
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return response()->json(['models' => $cached]);
        }

        $module = Module::find($moduleName);
        if (!$module) {
            return response()->json(['models' => []], 404);
        }

        $modelsPath = $module->getPath() . '/app/Models';
        if (!file_exists($modelsPath)) {
            $modelsPath = $module->getPath() . '/Models';
        }

        if (!file_exists($modelsPath)) {
            return response()->json(['models' => []]);
        }

        $files = scandir($modelsPath);
        $discovered = [];

        foreach ($files as $file) {
            if ($file === '.' || $file === '..' || !str_ends_with($file, '.php')) {
                continue;
            }

            $modelName = str_replace('.php', '', $file);
            $className = "Modules\\{$moduleName}\\Models\\{$modelName}";

            if (class_exists($className)) {
                try {
                    $model = new $className;
                    $table = $model->getTable();
                    $columns = Schema::getColumnListing($table);
                    $discovered[$modelName] = $columns;
                } catch (\Exception $e) {
                    continue;
                }
            }
        }

        Cache::put($cacheKey, $discovered, now()->addHours(24));

        return response()->json(['models' => $discovered]);
    }

}
