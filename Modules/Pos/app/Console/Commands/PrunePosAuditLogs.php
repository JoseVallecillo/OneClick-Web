<?php

namespace Modules\Pos\Console\Commands;

use Illuminate\Console\Command;
use Modules\Pos\Models\PosAuditLog;

class PrunePosAuditLogs extends Command
{
    protected $signature   = 'pos:prune-audit-logs {--days=180}';
    protected $description = 'Delete POS audit logs older than specified days (default: 180).';

    public function handle(): int
    {
        $days = $this->option('days');
        $cutoffDate = now()->subDays($days);

        $count = PosAuditLog::where('created_at', '<', $cutoffDate)->delete();

        if ($count > 0) {
            $this->info("Eliminados {$count} registro(s) de auditoría POS más antiguos que {$days} días.");
        } else {
            $this->info("No hay registros de auditoría para eliminar.");
        }

        return self::SUCCESS;
    }
}
