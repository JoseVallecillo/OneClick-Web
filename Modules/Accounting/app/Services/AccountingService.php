<?php

namespace Modules\Accounting\Services;

use Illuminate\Support\Facades\DB;
use Modules\Accounting\Models\Journal;
use Modules\Accounting\Models\Move;
use Modules\Accounting\Models\MoveLine;

/**
 * AccountingService — central facade for double-entry accounting operations.
 *
 * Other modules (Sales, Purchases, etc.) use this service to create journal
 * entries without coupling themselves to the Accounting module's internals.
 *
 * Usage from another module:
 *
 *   app(AccountingService::class)->createEntry([
 *       'journal_code'          => 'VJ',
 *       'date'                  => '2026-04-17',
 *       'narration'             => 'Venta VT-2026-0001',
 *       'source_document_type'  => 'sales_order',
 *       'source_document_id'    => 42,
 *       'created_by'            => auth()->id(),
 *       'post'                  => true,
 *       'lines' => [
 *           ['account_id' => 11, 'debit'  => 115.00, 'credit' => 0,      'name' => 'Cuentas por cobrar'],
 *           ['account_id' => 41, 'debit'  => 0,      'credit' => 100.00, 'name' => 'Ventas'],
 *           ['account_id' => 22, 'debit'  => 0,      'credit' => 15.00,  'name' => 'ISV por pagar'],
 *       ],
 *   ]);
 */
class AccountingService
{
    /**
     * Create a journal entry from any module.
     *
     * @param  array{
     *   journal_code: string,
     *   date: string,
     *   narration?: string,
     *   source_document_type?: string,
     *   source_document_id?: int,
     *   created_by: int,
     *   post?: bool,
     *   lines: array<array{account_id: int, debit: float, credit: float, name?: string, partner_id?: int, tax_id?: int}>
     * } $data
     */
    public function createEntry(array $data): Move
    {
        return DB::transaction(function () use ($data) {
            $journal = Journal::where('code', $data['journal_code'])
                ->where('active', true)
                ->firstOrFail();

            $move = Move::create([
                'reference'           => Move::generateReference($journal),
                'journal_id'          => $journal->id,
                'date'                => $data['date'],
                'narration'           => $data['narration'] ?? null,
                'state'               => 'draft',
                'source_document_type' => $data['source_document_type'] ?? null,
                'source_document_id'  => $data['source_document_id'] ?? null,
                'created_by'          => $data['created_by'],
            ]);

            foreach ($data['lines'] as $line) {
                MoveLine::create([
                    'move_id'    => $move->id,
                    'account_id' => $line['account_id'],
                    'partner_id' => $line['partner_id'] ?? null,
                    'tax_id'     => $line['tax_id'] ?? null,
                    'name'       => $line['name'] ?? null,
                    'debit'      => $line['debit'],
                    'credit'     => $line['credit'],
                ]);
            }

            if (! empty($data['post']) && $data['post'] === true) {
                $move->post($data['created_by']);
            }

            return $move->fresh('lines');
        });
    }

    /**
     * Reverse an existing posted entry.
     */
    public function reverseEntry(Move $move, int $userId, ?string $narration = null): Move
    {
        return $move->reverse($userId, $narration);
    }

    /**
     * Compute the trial balance (Balance de Comprobación) for a date range.
     *
     * Returns a collection with:
     *   account_id, code, name, type, opening_debit, opening_credit,
     *   period_debit, period_credit, closing_debit, closing_credit
     */
    public function trialBalance(?string $dateFrom = null, ?string $dateTo = null): \Illuminate\Support\Collection
    {
        $query = MoveLine::query()
            ->join('account_moves', 'account_moves.id', '=', 'account_move_lines.move_id')
            ->join('account_accounts', 'account_accounts.id', '=', 'account_move_lines.account_id')
            ->where('account_moves.state', 'posted')
            ->select(
                'account_accounts.id as account_id',
                'account_accounts.code',
                'account_accounts.name',
                'account_accounts.type',
                'account_accounts.normal_balance',
                DB::raw('SUM(account_move_lines.debit) as total_debit'),
                DB::raw('SUM(account_move_lines.credit) as total_credit')
            )
            ->groupBy('account_accounts.id', 'account_accounts.code', 'account_accounts.name', 'account_accounts.type', 'account_accounts.normal_balance')
            ->orderBy('account_accounts.code');

        if ($dateFrom) {
            $query->where('account_moves.date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->where('account_moves.date', '<=', $dateTo);
        }

        return $query->get()->map(function ($row) {
            $debit  = (float) $row->total_debit;
            $credit = (float) $row->total_credit;
            $balance = $row->normal_balance === 'debit' ? $debit - $credit : $credit - $debit;

            return [
                'account_id'     => $row->account_id,
                'code'           => $row->code,
                'name'           => $row->name,
                'type'           => $row->type,
                'normal_balance' => $row->normal_balance,
                'total_debit'    => $debit,
                'total_credit'   => $credit,
                'balance'        => $balance,
            ];
        });
    }

    /**
     * Generate a general ledger for a specific account within a date range.
     */
    public function generalLedger(int $accountId, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $query = MoveLine::with(['move.journal', 'partner'])
            ->where('account_id', $accountId)
            ->whereHas('move', fn ($q) => $q->where('state', 'posted'));

        if ($dateFrom) {
            $query->whereHas('move', fn ($q) => $q->where('date', '>=', $dateFrom));
        }

        if ($dateTo) {
            $query->whereHas('move', fn ($q) => $q->where('date', '<=', $dateTo));
        }

        $lines   = $query->get()->sortBy('move.date');
        $running = 0.0;

        return $lines->map(function ($line) use (&$running) {
            $running += (float) $line->debit - (float) $line->credit;

            return [
                'date'      => $line->move->date->toDateString(),
                'reference' => $line->move->reference,
                'journal'   => $line->move->journal->name ?? '—',
                'narration' => $line->name ?? $line->move->narration,
                'partner'   => $line->partner?->name,
                'debit'     => (float) $line->debit,
                'credit'    => (float) $line->credit,
                'balance'   => $running,
            ];
        })->values()->toArray();
    }

    /**
     * Compute balance by analytical account.
     */
    public function analyticalBalance(?string $dateFrom = null, ?string $dateTo = null): \Illuminate\Support\Collection
    {
        $query = MoveLine::query()
            ->join('account_moves', 'account_moves.id', '=', 'account_move_lines.move_id')
            ->leftJoin('account_analytical_accounts', 'account_analytical_accounts.id', '=', 'account_move_lines.analytical_account_id')
            ->leftJoin('account_accounts', 'account_accounts.id', '=', 'account_analytical_accounts.account_id')
            ->where('account_moves.state', 'posted')
            ->whereNotNull('account_move_lines.analytical_account_id')
            ->select(
                'account_analytical_accounts.id as analytical_account_id',
                'account_analytical_accounts.code',
                'account_analytical_accounts.name',
                'account_accounts.code as account_code',
                'account_accounts.name as account_name',
                DB::raw('SUM(account_move_lines.debit) as total_debit'),
                DB::raw('SUM(account_move_lines.credit) as total_credit')
            )
            ->groupBy('account_analytical_accounts.id', 'account_analytical_accounts.code', 'account_analytical_accounts.name', 'account_accounts.code', 'account_accounts.name')
            ->orderBy('account_analytical_accounts.code');

        if ($dateFrom) {
            $query->where('account_moves.date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->where('account_moves.date', '<=', $dateTo);
        }

        return $query->get()->map(function ($row) {
            $debit  = (float) $row->total_debit;
            $credit = (float) $row->total_credit;
            $balance = $debit - $credit;

            return [
                'analytical_account_id' => $row->analytical_account_id,
                'code'                  => $row->code,
                'name'                  => $row->name,
                'account_code'          => $row->account_code,
                'account_name'          => $row->account_name,
                'total_debit'           => $debit,
                'total_credit'          => $credit,
                'balance'               => $balance,
            ];
        });
    }

    /**
     * Generate ledger entries for a specific analytical account.
     */
    public function analyticalLedger(int $analyticalAccountId, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $query = MoveLine::with(['move.journal', 'partner', 'analyticalAccount'])
            ->where('analytical_account_id', $analyticalAccountId)
            ->whereHas('move', fn ($q) => $q->where('state', 'posted'));

        if ($dateFrom) {
            $query->whereHas('move', fn ($q) => $q->where('date', '>=', $dateFrom));
        }

        if ($dateTo) {
            $query->whereHas('move', fn ($q) => $q->where('date', '<=', $dateTo));
        }

        $lines   = $query->get()->sortBy('move.date');
        $running = 0.0;

        return $lines->map(function ($line) use (&$running) {
            $running += (float) $line->debit - (float) $line->credit;

            return [
                'date'      => $line->move->date->toDateString(),
                'reference' => $line->move->reference,
                'journal'   => $line->move->journal->name ?? '—',
                'narration' => $line->name ?? $line->move->narration,
                'partner'   => $line->partner?->name,
                'debit'     => (float) $line->debit,
                'credit'    => (float) $line->credit,
                'balance'   => $running,
            ];
        })->values()->toArray();
    }
}
