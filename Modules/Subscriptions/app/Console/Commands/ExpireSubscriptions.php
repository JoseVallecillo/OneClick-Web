<?php

namespace Modules\Subscriptions\Console\Commands;

use Illuminate\Console\Command;
use Modules\Subscriptions\Models\LicenseToken;
use Modules\Subscriptions\Models\Subscription;

class ExpireSubscriptions extends Command
{
    protected $signature   = 'subscriptions:expire';
    protected $description = 'Marca como expirados los tokens vencidos y desactiva suscripciones pasadas.';

    public function handle(): int
    {
        // Tokens pendientes cuya fecha de expiración ya pasó
        $expiredTokens = LicenseToken::where('status', 'pending')
            ->where('expires_at', '<=', now())
            ->update(['status' => 'expired']);

        $this->info("Tokens expirados: {$expiredTokens}");

        // Suscripciones activas cuyo ends_at ya pasó
        $expiredSubs = Subscription::where('is_active', true)
            ->where('ends_at', '<=', now())
            ->update(['is_active' => false]);

        $this->info("Suscripciones desactivadas: {$expiredSubs}");

        return self::SUCCESS;
    }
}
