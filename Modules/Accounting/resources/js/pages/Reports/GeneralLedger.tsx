import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { Head, router } from '@inertiajs/react';
import { BookMarked, Search } from 'lucide-react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface LedgerLine {
    date: string;
    reference: string;
    journal: string;
    narration: string | null;
    partner: string | null;
    debit: number;
    credit: number;
    balance: number;
}

interface AccountOption { id: number; code: string; name: string }
interface AccountInfo   { id: number; code: string; name: string; type: string }

interface Props {
    lines: LedgerLine[];
    account: AccountInfo | null;
    accounts: AccountOption[];
    filters: { account_id?: string; date_from?: string; date_to?: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function fmtNum(v: number) {
    return v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function GeneralLedger({ lines, account, accounts, filters }: Props) {
    const [accountId, setAccountId] = useState(filters.account_id ?? '');
    const [dateFrom, setDateFrom]   = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]       = useState(filters.date_to ?? '');

    function applyFilters() {
        const p: Record<string, string> = {};
        if (accountId) p.account_id = accountId;
        if (dateFrom)  p.date_from  = dateFrom;
        if (dateTo)    p.date_to    = dateTo;
        router.get('/accounting/reports/general-ledger', p, { preserveState: true });
    }

    const totalDebit  = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
    const closingBalance = lines.length > 0 ? lines[lines.length - 1].balance : 0;

    return (
        <>
            <Head title="Mayor General" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BookMarked className="h-4 w-4" />
                                Mayor General
                                {account && (
                                    <span className="ml-1 font-mono text-sm text-muted-foreground">
                                        — {account.code} {account.name}
                                    </span>
                                )}
                            </CardTitle>

                            <div className="flex flex-wrap items-center gap-2">
                                <Select value={accountId} onValueChange={setAccountId}>
                                    <SelectTrigger className="h-9 w-64 text-sm">
                                        <SelectValue placeholder="Seleccionar cuenta…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {accounts.map((a) => (
                                            <SelectItem key={a.id} value={String(a.id)} className="text-xs">
                                                <span className="font-mono mr-2 text-muted-foreground">{a.code}</span>
                                                {a.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="relative">
                                    <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                                        className="h-9 w-32 text-xs" />
                                    <span className="absolute -top-3 left-1 text-[9px] text-muted-foreground uppercase font-bold bg-background px-1">Desde</span>
                                </div>
                                <div className="relative">
                                    <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                                        className="h-9 w-32 text-xs" />
                                    <span className="absolute -top-3 left-1 text-[9px] text-muted-foreground uppercase font-bold bg-background px-1">Hasta</span>
                                </div>
                                <Button size="sm" variant="outline" className="h-9 gap-1.5 text-xs" onClick={applyFilters}>
                                    <Search className="h-3.5 w-3.5" /> Consultar
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {!account ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <BookMarked className="h-8 w-8 opacity-40" />
                                <p className="text-sm">Seleccione una cuenta para ver su mayor.</p>
                            </div>
                        ) : lines.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <BookMarked className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No hay movimientos para esta cuenta en el período.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                            <th className="pb-2 pr-3 font-semibold w-24">Fecha</th>
                                            <th className="pb-2 pr-3 font-semibold w-32">Referencia</th>
                                            <th className="pb-2 pr-3 font-semibold w-28">Diario</th>
                                            <th className="pb-2 pr-3 font-semibold">Descripción</th>
                                            <th className="pb-2 pr-3 font-semibold w-28">Socio</th>
                                            <th className="pb-2 pr-3 font-semibold text-right w-28">Debe</th>
                                            <th className="pb-2 pr-3 font-semibold text-right w-28">Haber</th>
                                            <th className="pb-2 font-semibold text-right w-32">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.map((line, idx) => (
                                            <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                                                <td className="py-2 pr-3 text-xs tabular-nums">{fmtDate(line.date)}</td>
                                                <td className="py-2 pr-3 font-mono text-xs text-primary">{line.reference}</td>
                                                <td className="py-2 pr-3 text-xs text-muted-foreground">{line.journal}</td>
                                                <td className="py-2 pr-3 text-xs max-w-[200px] truncate">{line.narration ?? '—'}</td>
                                                <td className="py-2 pr-3 text-xs text-muted-foreground">{line.partner ?? '—'}</td>
                                                <td className="py-2 pr-3 text-right font-mono text-xs tabular-nums">
                                                    {line.debit > 0 ? fmtNum(line.debit) : '—'}
                                                </td>
                                                <td className="py-2 pr-3 text-right font-mono text-xs tabular-nums">
                                                    {line.credit > 0 ? fmtNum(line.credit) : '—'}
                                                </td>
                                                <td className={`py-2 text-right font-mono text-xs tabular-nums font-semibold ${line.balance < 0 ? 'text-red-600' : ''}`}>
                                                    {fmtNum(Math.abs(line.balance))}
                                                    {line.balance < 0 ? ' Cr' : ''}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 font-bold bg-muted/30">
                                            <td colSpan={5} className="pt-2 pb-1 text-xs uppercase tracking-wider text-muted-foreground">Totales del período</td>
                                            <td className="pt-2 pb-1 text-right font-mono tabular-nums text-sm">{fmtNum(totalDebit)}</td>
                                            <td className="pt-2 pb-1 text-right font-mono tabular-nums text-sm">{fmtNum(totalCredit)}</td>
                                            <td className={`pt-2 pb-1 text-right font-mono tabular-nums text-sm ${closingBalance < 0 ? 'text-red-600' : ''}`}>
                                                {fmtNum(Math.abs(closingBalance))}
                                                {closingBalance < 0 ? ' Cr' : ''}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

GeneralLedger.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Mayor General', href: '/accounting/reports/general-ledger' },
    ],
};
