<?php

namespace Modules\Subscriptions\Console\Commands;

use Illuminate\Console\Command;
use Modules\Subscriptions\Models\LicenseToken;
use Modules\Subscriptions\Models\Subscription;
use Modules\Subscriptions\Services\SubscriptionsAuditService;

class ExpireSubscriptions extends Command
{
    protected $signature   = 'subscriptions:expire';
    protected $description = 'Marca como expirados los tokens vencidos y desactiva suscripciones pasadas.';

    public function handle(): int
    {
        // Tokens pendientes cuya fecha de expiración ya pasó
        $expiredTokens = LicenseToken::where('status', 'pending')
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($expiredTokens as $token) {
            $token->update(['status' => 'expired']);
            SubscriptionsAuditService::logTokenExpiration(
                $token->id,
                $token->company_id,
                $token->plan_id,
            );
        }

        $this->info("Tokens expirados: {$expiredTokens->count()}");

        // Suscripciones activas cuyo ends_at ya pasó
        $expiredSubs = Subscription::where('is_active', true)
            ->where('ends_at', '<=', now())
            ->get();

        foreach ($expiredSubs as $subscription) {
            $subscription->update(['is_active' => false]);
            SubscriptionsAuditService::logSubscriptionExpiration(
                $subscription->id,
                $subscription->company_id,
                $subscription->plan_id,
            );
        }

        $this->info("Suscripciones desactivadas: {$expiredSubs->count()}");

        return self::SUCCESS;
    }
}
