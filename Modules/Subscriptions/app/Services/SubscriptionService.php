<?php

namespace Modules\Subscriptions\Services;

use Modules\Settings\Models\Company;
use Modules\Subscriptions\Models\Subscription;

class SubscriptionService
{
    /**
     * Devuelve la suscripción activa y vigente de una empresa.
     * Retorna null si no existe o si está vencida.
     */
    public function activeFor(Company $company): ?Subscription
    {
        return Subscription::with('plan')
            ->where('company_id', $company->id)
            ->where('is_active', true)
            ->where('ends_at', '>', now())
            ->latest('starts_at')
            ->first();
    }

    /**
     * Verifica si la empresa puede agregar un usuario más según su plan.
     * Si no tiene suscripción activa, se bloquea por defecto.
     * Si el plan es ilimitado (user_limit null), siempre permite.
     */
    public function canAddUser(Company $company): bool
    {
        $subscription = $this->activeFor($company);

        if (! $subscription) {
            return false;
        }

        if ($subscription->plan->isUnlimited()) {
            return true;
        }

        $currentUsers = $company->users()->count();

        return $currentUsers < $subscription->plan->user_limit;
    }

    /**
     * Datos de suscripción para compartir con el frontend via Inertia.
     * Retorna null si no hay empresa activa en sesión.
     *
     * @return array{plan_name:string, days_remaining:int, is_expired:bool, user_limit:int|null, is_unlimited:bool}|null
     */
    public function shareData(?Company $company): ?array
    {
        if (! $company) {
            return null;
        }

        $subscription = $this->activeFor($company);

        if (! $subscription) {
            return [
                'plan_name'     => null,
                'days_remaining' => 0,
                'is_expired'    => true,
                'user_limit'    => null,
                'is_unlimited'  => false,
            ];
        }

        return [
            'plan_name'      => $subscription->plan->name,
            'days_remaining' => $subscription->daysRemaining(),
            'is_expired'     => ! $subscription->isValid(),
            'user_limit'     => $subscription->plan->user_limit,
            'is_unlimited'   => $subscription->plan->isUnlimited(),
        ];
    }
}
