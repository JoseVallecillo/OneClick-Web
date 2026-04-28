<?php

namespace Modules\Governance\Console\Commands;

use Illuminate\Console\Command;
use Modules\Governance\Models\GovernanceAuditLog;

class PruneGovernanceAuditLogs extends Command
{
    protected $signature   = 'governance:prune-audit-logs {--days=90}';
    protected $description = 'Delete governance audit logs older than specified days (default: 90).';

    public function handle(): int
    {
        $days = $this->option('days');
        $cutoffDate = now()->subDays($days);

        $count = GovernanceAuditLog::where('created_at', '<', $cutoffDate)->delete();

        if ($count > 0) {
            $this->info("Eliminados {$count} registro(s) de auditoría de gobernanza más antiguos que {$days} días.");
        } else {
            $this->info("No hay registros de auditoría para eliminar.");
        }

        return self::SUCCESS;
    }
}
