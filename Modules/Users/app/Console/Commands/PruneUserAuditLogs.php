<?php

namespace Modules\Users\Console\Commands;

use Illuminate\Console\Command;
use Modules\Users\Models\UserAuditLog;

class PruneUserAuditLogs extends Command
{
    protected $signature   = 'users:prune-audit-logs {--days=180}';
    protected $description = 'Delete user audit logs older than specified days (default: 180).';

    public function handle(): int
    {
        $days = $this->option('days');
        $cutoffDate = now()->subDays($days);

        $count = UserAuditLog::where('created_at', '<', $cutoffDate)->delete();

        if ($count > 0) {
            $this->info("Eliminados {$count} registro(s) de auditoría de usuarios más antiguos que {$days} días.");
        } else {
            $this->info("No hay registros de auditoría para eliminar.");
        }

        return self::SUCCESS;
    }
}
