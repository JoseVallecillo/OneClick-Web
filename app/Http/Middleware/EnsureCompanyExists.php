<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyExists
{
    /**
     * Rutas que se permiten sin que exista empresa ni suscripción.
     * Auth, selector de sucursal y las rutas de creación de empresa/sucursal.
     */
    private const EXEMPT_PREFIXES = [
        'settings',              // todo /settings/* (crear empresa, sucursal)
        'app-store',             // tienda de módulos — no requiere empresa configurada
        'subscription-expired',  // página de licencia expirada
        'activate-license',
        'select-branch',
        'login',
        'logout',
        'register',
        'forgot-password',
        'reset-password',
        'verify-email',
        'email',
        'up',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()) {
            return $next($request);
        }

        // Rutas exentas — no requieren empresa
        foreach (self::EXEMPT_PREFIXES as $prefix) {
            if ($request->is($prefix) || $request->is("{$prefix}/*")) {
                return $next($request);
            }
        }

        // Verificar que exista al menos una empresa
        try {
            $companyClass = \Modules\Settings\Models\Company::class;

            if (! class_exists($companyClass)) {
                return $next($request);
            }

            $company = $companyClass::first();

            if (! $company) {
                // Auto-provisionar empresa + sucursal + suscripción de prueba 30 días.
                try {
                    app(\App\Services\TrialProvisioner::class)->provision();
                    $company = $companyClass::first();
                } catch (\Throwable) {}

                if (! $company) {
                    return redirect('/settings')
                        ->with('setup_notice', 'Antes de continuar, registra los datos de tu empresa y crea al menos una sucursal.');
                }
            }

            // Verificar que exista al menos una sucursal
            $hasBranch = \Modules\Settings\Models\Branch::where('active', true)->exists();

            if (! $hasBranch) {
                return redirect('/settings')
                    ->with('setup_notice', 'Debes crear al menos una sucursal activa antes de continuar.');
            }

            // Moneda e impuesto se verifican solo si Accounting está activo y
            // el usuario intenta acceder a rutas financieras (accounting/*).
            if ($request->is('accounting/*')
                && \Nwidart\Modules\Facades\Module::isEnabled('Accounting')) {

                if (class_exists(\Modules\Settings\Models\Currency::class)
                    && ! \Modules\Settings\Models\Currency::exists()) {
                    return redirect('/settings')
                        ->with('setup_notice', 'Configura al menos una moneda antes de usar Contabilidad.');
                }

                if (class_exists(\Modules\Accounting\Models\Tax::class)
                    && ! \Modules\Accounting\Models\Tax::exists()) {
                    return redirect('/accounting/taxes')
                        ->with('setup_notice', 'Configura al menos un impuesto antes de usar Contabilidad.');
                }
            }
        } catch (\Throwable) {
            // Tablas no creadas aún — dejar pasar
        }

        return $next($request);
    }
}
