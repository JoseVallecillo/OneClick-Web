<?php

namespace Modules\Sales\Console\Commands;

use Illuminate\Console\Command;
use Modules\Sales\Models\SalesAuditLog;

class PruneSalesAuditLogs extends Command
{
    protected $signature   = 'sales:prune-audit-logs {--days=180}';
    protected $description = 'Delete sales audit logs older than specified days (default: 180).';

    public function handle(): int
    {
        $count = SalesAuditLog::where('created_at', '<', now()->subDays($this->option('days')))->delete();
        if ($count > 0) {
            $this->info("Eliminados {$count} registro(s) de auditoría de ventas.");
        }
        return self::SUCCESS;
    }
}
