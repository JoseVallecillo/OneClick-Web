<?php

namespace Modules\Subscriptions\Console\Commands;

use Illuminate\Console\Command;
use Modules\Subscriptions\Models\SubscriptionsAuditLog;

class PruneSubscriptionsAuditLogs extends Command
{
    protected $signature = 'subscriptions:prune-audit-logs {--days=365}';
    protected $description = 'Delete subscriptions audit logs older than specified days (default: 365).';

    public function handle(): int
    {
        $count = SubscriptionsAuditLog::where('created_at', '<', now()->subDays($this->option('days')))->delete();
        if ($count > 0) $this->info("Eliminados {$count} registro(s) de auditoría de suscripciones.");
        return self::SUCCESS;
    }
}
