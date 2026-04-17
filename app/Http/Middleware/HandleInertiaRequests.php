<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                // Cargamos el perfil junto al usuario para que all_permissions
                // no dispare una query adicional cuando se llame en controllers.
                'user'             => $request->user()?->loadMissing('profile'),
                'active_branch'    => $this->resolveActiveBranch($request),
                'ui_rules'         => $this->resolveUiRules($request),
                'field_validators' => $this->resolveFieldValidators($request),
                'subscription'     => $this->resolveSubscription($request),
                'setup'            => $this->resolveSetup($request),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * Resolve the active branch from the session and share it globally.
     * Returns null when no branch is selected or the Settings module is not installed.
     *
     * @return array{id:int,name:string,company_name:string}|null
     */
    private function resolveActiveBranch(Request $request): ?array
    {
        if (! $request->user()) {
            return null;
        }

        $branchId = session('active_branch_id');

        if (! $branchId) {
            return null;
        }

        $branchClass = \Modules\Settings\Models\Branch::class;

        if (! class_exists($branchClass)) {
            return null;
        }

        try {
            $branch = $branchClass::with('company:id,commercial_name')
                ->find($branchId, ['id', 'name', 'company_id']);

            if (! $branch) {
                return null;
            }

            return [
                'id'           => $branch->id,
                'name'         => $branch->name,
                'company_name' => $branch->company?->commercial_name ?? '',
            ];
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Load active governance rules for the authenticated user's role.
     * Returns a nested map: { ModuleName: { elementId: { action_type } } }
     * Returns an empty array when the Governance module is not installed.
     *
     * @return array<string, array<string, array{action_type: string}>>
     */
    private function resolveUiRules(Request $request): array
    {
        if (! $request->user()) {
            return [];
        }

        $ruleClass = \Modules\Governance\Models\UiGovernanceRule::class;

        if (! class_exists($ruleClass)) {
            return [];
        }

        try {
            $user     = $request->user(); // profile already loaded via loadMissing
            $userRole = $user->role ?? 'user';

            return $ruleClass::where('active', true)
                ->where(function ($q) use ($userRole) {
                    $q->whereNull('user_role')->orWhere('user_role', $userRole);
                })
                ->get(['module_name', 'element_identifier', 'action_type', 'permission_key'])
                // Si la regla tiene permission_key, solo aplica a usuarios que NO tienen ese permiso.
                // Esto permite que el sistema de Perfiles anule reglas de Governance individualmente.
                ->filter(function ($rule) use ($user) {
                    if (! $rule->permission_key) {
                        return true;
                    }
                    return ! $user->hasPermission($rule->permission_key);
                })
                ->groupBy('module_name')
                ->map(
                    fn ($group) => $group
                        ->keyBy('element_identifier')
                        ->map(fn ($rule) => ['action_type' => $rule->action_type])
                )
                ->toArray();
        } catch (\Throwable) {
            // Table may not exist yet (before migration runs)
            return [];
        }
    }

    /**
     * Load active field validators for the authenticated user's role.
     * Returns: { ModuleName: { fieldId: { validation_type } } }
     * Returns an empty array when the Governance module is not installed.
     *
     * @return array<string, array<string, array{validation_type: string}>>
     */
    private function resolveFieldValidators(Request $request): array
    {
        if (! $request->user()) {
            return [];
        }

        $validatorClass = \Modules\Governance\Models\GovernanceFieldValidator::class;

        if (! class_exists($validatorClass)) {
            return [];
        }

        try {
            $userRole = $request->user()->role ?? 'user';

            return $validatorClass::where('active', true)
                ->where(function ($q) use ($userRole) {
                    $q->whereNull('user_role')->orWhere('user_role', $userRole);
                })
                ->get(['module_name', 'field_identifier', 'validation_type'])
                ->groupBy('module_name')
                ->map(
                    fn ($group) => $group
                        ->keyBy('field_identifier')
                        ->map(fn ($v) => ['validation_type' => $v->validation_type])
                )
                ->toArray();
        } catch (\Throwable) {
            return [];
        }
    }

    /**
     * Resolve setup status: whether company and branch exist and subscription is active.
     *
     * @return array{has_company:bool, has_branch:bool, has_subscription:bool}
     */
    private function resolveSetup(Request $request): array
    {
        $default = ['has_company' => false, 'has_branch' => false, 'has_subscription' => false];

        if (! $request->user()) {
            return $default;
        }

        try {
            $companyClass = \Modules\Settings\Models\Company::class;
            $branchClass  = \Modules\Settings\Models\Branch::class;

            if (! class_exists($companyClass) || ! class_exists($branchClass)) {
                return $default;
            }

            $company    = $companyClass::first();
            $hasBranch  = $branchClass::where('active', true)->exists();

            $hasSubscription = false;
            if ($company) {
                $serviceClass = \Modules\Subscriptions\Services\SubscriptionService::class;
                if (class_exists($serviceClass)) {
                    $hasSubscription = app($serviceClass)->activeFor($company) !== null;
                }
            }

            return [
                'has_company'      => $company !== null,
                'has_branch'       => $hasBranch,
                'has_subscription' => $hasSubscription,
            ];
        } catch (\Throwable) {
            return $default;
        }
    }

    /**
     * Resolve subscription data for the active company and share it globally.
     * Returns null when the user is not authenticated or the module is not installed.
     *
     * @return array{plan_name:string|null, days_remaining:int, is_expired:bool, user_limit:int|null, is_unlimited:bool}|null
     */
    private function resolveSubscription(Request $request): ?array
    {
        if (! $request->user()) {
            return null;
        }

        $serviceClass = \Modules\Subscriptions\Services\SubscriptionService::class;

        if (! class_exists($serviceClass)) {
            return null;
        }

        try {
            // Intentamos obtener la empresa desde la sucursal activa en sesión
            $branchId = session('active_branch_id');
            $company  = null;

            if ($branchId) {
                $branch  = \Modules\Settings\Models\Branch::find($branchId, ['id', 'company_id']);
                $company = $branch?->company;
            }

            // Si no hay sucursal activa, tomamos la primera empresa (instalación mono-empresa)
            if (! $company) {
                $company = \Modules\Settings\Models\Company::first();
            }

            /** @var \Modules\Subscriptions\Services\SubscriptionService $service */
            $service = app($serviceClass);

            return $service->shareData($company);
        } catch (\Throwable) {
            return null;
        }
    }
}
