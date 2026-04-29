<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Subscriptions\Services\SubscriptionService;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscriptionActive
{
    public function handle(Request $request, Closure $next): Response
    {
        // Si el módulo Subscriptions está deshabilitado, se omite la verificación.
        if (!\Nwidart\Modules\Facades\Module::isEnabled('Subscriptions')) {
            return $next($request);
        }

        $user = $request->user();

        // Los administradores siempre pasan (necesitan acceso para configurar la empresa).
        if ($user && ($user->role ?? 'user') === 'admin') {
            return $next($request);
        }

        // Si no hay ninguna empresa registrada aún, se permite el acceso (modo instalación).
        try {
            $companyClass = \Modules\Settings\Models\Company::class;
            if (class_exists($companyClass) && !$companyClass::exists()) {
                return $next($request);
            }
        } catch (\Throwable) {}

        // Obtener la empresa desde la sucursal activa en sesión.
        $company = null;
        try {
            $branchId = session('active_branch_id');
            if ($branchId) {
                $branch  = \Modules\Settings\Models\Branch::find($branchId);
                $company = $branch?->company;
            }
            if (!$company) {
                $company = \Modules\Settings\Models\Company::first();
            }
        } catch (\Throwable) {}

        if (!$company) {
            return redirect()->route('subscription-expired');
        }

        $subscriptionService = app(SubscriptionService::class);

        if (!$subscriptionService->activeFor($company)) {
            return redirect()->route('subscription-expired');
        }

        return $next($request);
    }
}
