<?php

namespace Modules\Settings\Console\Commands;

use Illuminate\Console\Command;
use Modules\Settings\Models\SettingsAuditLog;

class PruneSettingsAuditLogs extends Command
{
    protected $signature = 'settings:prune-audit-logs {--days=365}';
    protected $description = 'Delete settings audit logs older than specified days (default: 365).';

    public function handle(): int
    {
        $count = SettingsAuditLog::where('created_at', '<', now()->subDays($this->option('days')))->delete();
        if ($count > 0) $this->info("Eliminados {$count} registro(s) de auditoría de configuración.");
        return self::SUCCESS;
    }
}
