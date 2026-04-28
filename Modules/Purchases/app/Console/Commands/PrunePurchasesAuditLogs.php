<?php

namespace Modules\Purchases\Console\Commands;

use Illuminate\Console\Command;
use Modules\Purchases\Models\PurchasesAuditLog;

class PrunePurchasesAuditLogs extends Command
{
    protected $signature = 'purchases:prune-audit-logs {--days=180}';
    protected $description = 'Delete purchases audit logs older than specified days (default: 180).';

    public function handle(): int
    {
        $count = PurchasesAuditLog::where('created_at', '<', now()->subDays($this->option('days')))->delete();
        if ($count > 0) $this->info("Eliminados {$count} registro(s) de auditoría de compras.");
        return self::SUCCESS;
    }
}
