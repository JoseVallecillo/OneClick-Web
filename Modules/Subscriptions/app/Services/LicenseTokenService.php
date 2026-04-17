<?php

namespace Modules\Subscriptions\Services;

use App\Models\User;
use Illuminate\Support\Str;
use Modules\Settings\Models\Company;
use Modules\Subscriptions\Models\LicenseToken;
use Modules\Subscriptions\Models\Subscription;
use Modules\Subscriptions\Models\SubscriptionPlan;

class LicenseTokenService
{
    /**
     * Genera un token firmado HMAC-SHA256 y lo persiste en la BD.
     * Además, revoca cualquier token pendiente anterior para la misma empresa.
     */
    public function generate(
        Company $company,
        SubscriptionPlan $plan,
        User $createdBy,
        string $recipientEmail,
        int $linkExpiresHours = 48,
    ): LicenseToken {
        // Revocar tokens pendientes anteriores para esta empresa
        LicenseToken::where('company_id', $company->id)
            ->where('status', 'pending')
            ->update(['status' => 'revoked']);

        // Payload único y firmado
        $raw   = implode('|', [$company->id, $plan->id, now()->timestamp, Str::random(16)]);
        $token = hash_hmac('sha256', $raw, config('app.key'));

        return LicenseToken::create([
            'company_id'      => $company->id,
            'plan_id'         => $plan->id,
            'created_by'      => $createdBy->id,
            'recipient_email' => $recipientEmail,
            'token'           => $token,
            'expires_at'      => now()->addHours($linkExpiresHours),
            'status'          => 'pending',
        ]);
    }

    /**
     * Activa la licencia asociada al token.
     * Retorna la suscripción creada o lanza una excepción descriptiva.
     *
     * @throws \RuntimeException
     */
    public function activate(string $token): Subscription
    {
        $record = LicenseToken::with(['company', 'plan'])
            ->where('token', $token)
            ->firstOrFail();

        if ($record->status === 'used') {
            throw new \RuntimeException('Este token ya fue utilizado.');
        }

        if ($record->status === 'revoked') {
            throw new \RuntimeException('Este token fue revocado.');
        }

        if ($record->status === 'expired' || $record->expires_at->isPast()) {
            $record->update(['status' => 'expired']);
            throw new \RuntimeException('Este token ha expirado.');
        }

        // Desactivar suscripción activa anterior
        Subscription::where('company_id', $record->company_id)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        $subscription = Subscription::create([
            'company_id' => $record->company_id,
            'plan_id'    => $record->plan_id,
            'starts_at'  => now(),
            'ends_at'    => now()->addDays($record->plan->duration_days),
            'is_active'  => true,
        ]);

        $record->update([
            'status'  => 'used',
            'used_at' => now(),
        ]);

        return $subscription;
    }
}
