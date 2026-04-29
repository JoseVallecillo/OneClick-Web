<?php

namespace Modules\Accounting\Console\Commands;

use Illuminate\Console\Command;
use Modules\Accounting\Models\AccountingAuditLog;

class PruneAccountingAuditLogs extends Command
{
    protected $signature   = 'accounting:prune-audit-logs {--days=365}';
    protected $description = 'Delete accounting audit logs older than specified days (default: 365 for compliance).';

    public function handle(): int
    {
        $days = $this->option('days');
        $cutoffDate = now()->subDays($days);

        $count = AccountingAuditLog::where('created_at', '<', $cutoffDate)->delete();

        if ($count > 0) {
            $this->info("Eliminados {$count} registro(s) de auditoría contable más antiguos que {$days} días.");
        } else {
            $this->info("No hay registros de auditoría para eliminar.");
        }

        return self::SUCCESS;
    }
}
