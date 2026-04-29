<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class TrialProvisioner
{
    public const TRIAL_PLAN_NAME  = 'Básico';
    public const TRIAL_DAYS       = 30;

    /**
     * Provisiona empresa, sucursal y suscripción de prueba si aún no existen.
     * Es idempotente: puede llamarse múltiples veces sin duplicar datos.
     *
     * @return bool  true si se creó algo nuevo, false si ya estaba configurado.
     */
    public function provision(): bool
    {
        if (! $this->modulesReady()) {
            return false;
        }

        $companyClass      = \Modules\Settings\Models\Company::class;
        $branchClass       = \Modules\Settings\Models\Branch::class;
        $planClass         = \Modules\Subscriptions\Models\SubscriptionPlan::class;
        $subscriptionClass = \Modules\Subscriptions\Models\Subscription::class;

        // Si ya existe empresa con suscripción activa no hacemos nada.
        $company = $companyClass::first();
        if ($company && $subscriptionClass::where('company_id', $company->id)
                ->where('is_active', true)
                ->where('ends_at', '>', now())
                ->exists()) {
            return false;
        }

        DB::transaction(function () use (
            $companyClass, $branchClass, $planClass, $subscriptionClass
        ) {
            // 1. Empresa — usar la existente o crear una por defecto
            $company = $companyClass::first() ?? $companyClass::create([
                'commercial_name' => 'Mi Empresa',
                'legal_name'      => 'Mi Empresa S.A.',
                'currency'        => 'HNL',
                'timezone'        => 'America/Tegucigalpa',
                'date_format'     => 'd/m/Y',
            ]);

            // 2. Sucursal principal
            $branchClass::firstOrCreate(
                ['company_id' => $company->id, 'name' => 'Sucursal Principal'],
                [
                    'company_id' => $company->id,
                    'name'       => 'Sucursal Principal',
                    'active'     => true,
                ]
            );

            // 3. Plan de prueba
            $plan = $planClass::firstOrCreate(
                ['name' => self::TRIAL_PLAN_NAME],
                [
                    'name'          => self::TRIAL_PLAN_NAME,
                    'user_limit'    => null,   // ilimitado durante la prueba
                    'duration_days' => self::TRIAL_DAYS,
                    'active'        => true,
                ]
            );

            // 4. Suscripción de prueba (solo si no existe una activa)
            $hasActive = $subscriptionClass::where('company_id', $company->id)
                ->where('is_active', true)
                ->where('ends_at', '>', now())
                ->exists();

            if (! $hasActive) {
                $subscriptionClass::create([
                    'company_id' => $company->id,
                    'plan_id'    => $plan->id,
                    'starts_at'  => now(),
                    'ends_at'    => now()->addDays(self::TRIAL_DAYS),
                    'is_active'  => true,
                ]);
            }
        });

        return true;
    }

    private function modulesReady(): bool
    {
        try {
            return \Nwidart\Modules\Facades\Module::isEnabled('Settings')
                && \Nwidart\Modules\Facades\Module::isEnabled('Subscriptions')
                && class_exists(\Modules\Settings\Models\Company::class)
                && class_exists(\Modules\Subscriptions\Models\Subscription::class);
        } catch (\Throwable) {
            return false;
        }
    }
}
