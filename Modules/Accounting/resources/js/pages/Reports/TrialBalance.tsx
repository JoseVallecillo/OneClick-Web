import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';
import { Head, router, usePage } from '@inertiajs/react';
import { BarChart3, Search } from 'lucide-react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface TrialRow {
    account_id: number;
    code: string;
    name: string;
    type: string;
    normal_balance: string;
    total_debit: number;
    total_credit: number;
    balance: number;
}

interface Totals {
    debit: number;
    credit: number;
}

interface Props {
    rows: TrialRow[];
    totals: Totals;
    filters: { date_from?: string; date_to?: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
    asset: 'Activo', liability: 'Pasivo', equity: 'Patrimonio', income: 'Ingreso', expense: 'Gasto',
};

function fmtNum(v: number) {
    return v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TrialBalance({ rows, totals, filters }: Props) {
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]     = useState(filters.date_to ?? '');
    const [search, setSearch]     = useState('');

    function applyFilters() {
        const p: Record<string, string> = {};
        if (dateFrom) p.date_from = dateFrom;
        if (dateTo)   p.date_to   = dateTo;
        router.get('/accounting/reports/trial-balance', p, { preserveState: true });
    }

    const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01;

    const filtered = search
        ? rows.filter((r) => r.code.includes(search) || r.name.toLowerCase().includes(search.toLowerCase()))
        : rows;

    // Group by type
    const grouped: Record<string, TrialRow[]> = {};
    filtered.forEach((r) => {
        (grouped[r.type] ??= []).push(r);
    });

    return (
        <>
            <Head title="Balance de Comprobación" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BarChart3 className="h-4 w-4" />
                                Balance de Comprobación
                            </CardTitle>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Date range */}
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
                                    <Search className="h-3.5 w-3.5" /> Aplicar
                                </Button>

                                {/* Search within results */}
                                <Input placeholder="Filtrar cuenta…" value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-9 w-40 text-xs" />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {rows.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <BarChart3 className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No hay movimientos en el período seleccionado.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                            <th className="pb-2 pr-4 font-semibold w-20">Código</th>
                                            <th className="pb-2 pr-4 font-semibold">Nombre de cuenta</th>
                                            <th className="pb-2 pr-4 font-semibold w-24">Tipo</th>
                                            <th className="pb-2 pr-4 font-semibold text-right w-32">Debe</th>
                                            <th className="pb-2 pr-4 font-semibold text-right w-32">Haber</th>
                                            <th className="pb-2 font-semibold text-right w-32">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(grouped).map(([type, typeRows]) => (
                                            <>
                                                <tr key={`group-${type}`} className="bg-muted/40">
                                                    <td colSpan={6} className="py-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                        {TYPE_LABELS[type] ?? type}
                                                    </td>
                                                </tr>
                                                {typeRows.map((row) => (
                                                    <tr key={row.account_id} className="border-b last:border-0 hover:bg-muted/20">
                                                        <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{row.code}</td>
                                                        <td className="py-2 pr-4 text-[13px]">{row.name}</td>
                                                        <td className="py-2 pr-4 text-xs text-muted-foreground">{TYPE_LABELS[row.type]}</td>
                                                        <td className="py-2 pr-4 text-right font-mono text-xs tabular-nums">
                                                            {row.total_debit > 0 ? fmtNum(row.total_debit) : '—'}
                                                        </td>
                                                        <td className="py-2 pr-4 text-right font-mono text-xs tabular-nums">
                                                            {row.total_credit > 0 ? fmtNum(row.total_credit) : '—'}
                                                        </td>
                                                        <td className={`py-2 text-right font-mono text-xs tabular-nums font-semibold ${row.balance < 0 ? 'text-red-600' : ''}`}>
                                                            {fmtNum(Math.abs(row.balance))}
                                                            {row.balance < 0 ? ' Cr' : ''}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 font-bold text-sm bg-muted/30">
                                            <td colSpan={3} className="pt-3 pb-2 text-xs uppercase tracking-wider">Totales generales</td>
                                            <td className={`pt-3 pb-2 text-right font-mono tabular-nums ${!isBalanced ? 'text-red-600' : ''}`}>
                                                {fmtNum(totals.debit)}
                                            </td>
                                            <td className={`pt-3 pb-2 text-right font-mono tabular-nums ${!isBalanced ? 'text-red-600' : ''}`}>
                                                {fmtNum(totals.credit)}
                                            </td>
                                            <td className="pt-3 pb-2 text-right">
                                                {isBalanced ? (
                                                    <span className="text-xs text-green-700 font-semibold">✓ Balanceado</span>
                                                ) : (
                                                    <span className="text-xs text-red-600 font-semibold">✗ Diferencia: {fmtNum(Math.abs(totals.debit - totals.credit))}</span>
                                                )}
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

TrialBalance.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Balance de Comprobación', href: '/accounting/reports/trial-balance' },
    ],
};
