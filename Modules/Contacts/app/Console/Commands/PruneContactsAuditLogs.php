<?php

namespace Modules\Contacts\Console\Commands;

use Illuminate\Console\Command;
use Modules\Contacts\Models\ContactsAuditLog;

class PruneContactsAuditLogs extends Command
{
    protected $signature = 'contacts:prune-audit-logs {--days=180}';
    protected $description = 'Delete contacts audit logs older than specified days (default: 180).';

    public function handle(): int
    {
        $count = ContactsAuditLog::where('created_at', '<', now()->subDays($this->option('days')))->delete();
        if ($count > 0) $this->info("Eliminados {$count} registro(s) de auditoría de contactos.");
        return self::SUCCESS;
    }
}
