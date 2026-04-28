<?php

namespace Modules\Inventory\Console\Commands;

use Illuminate\Console\Command;
use Modules\Inventory\Models\InventoryAuditLog;

class PruneInventoryAuditLogs extends Command
{
    protected $signature   = 'inventory:prune-audit-logs {--days=180}';
    protected $description = 'Delete inventory audit logs older than specified days (default: 180).';

    public function handle(): int
    {
        $days = $this->option('days');
        $cutoffDate = now()->subDays($days);

        $count = InventoryAuditLog::where('created_at', '<', $cutoffDate)->delete();

        if ($count > 0) {
            $this->info("Eliminados {$count} registro(s) de auditoría de inventario más antiguos que {$days} días.");
        } else {
            $this->info("No hay registros de auditoría para eliminar.");
        }

        return self::SUCCESS;
    }
}
