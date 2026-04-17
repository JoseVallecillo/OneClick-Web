<?php

namespace Modules\Governance\Console\Commands;

use Illuminate\Console\Command;
use Modules\Governance\Models\GovernanceAuthRequest;

class ExpireGovernanceRequests extends Command
{
    protected $signature   = 'governance:expire-requests';
    protected $description = 'Mark pending authorization requests as expired when their time limit has passed.';

    public function handle(): int
    {
        $count = GovernanceAuthRequest::expired()->update(['status' => 'expired']);

        if ($count > 0) {
            $this->info("Expiradas {$count} solicitud(es) de autorización.");
        }

        return self::SUCCESS;
    }
}
