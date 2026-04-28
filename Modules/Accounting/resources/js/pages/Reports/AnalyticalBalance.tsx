import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface AnalyticalBalanceRow {
    analytical_account_id: number;
    code: string;
    name: string;
    account_code: string | null;
    account_name: string | null;
    total_debit: number;
    total_credit: number;
    balance: number;
}

interface Props {
    rows: AnalyticalBalanceRow[];
    totals: { debit: number; credit: number };
    filters: { date_from?: string; date_to?: string };
}

export default function AnalyticalBalance({ rows, totals, filters }: Props) {
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]     = useState(filters.date_to ?? '');

    function handleFilter() {
        const params: Record<string, string> = {};
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        router.get('/accounting/reports/analytical-balance', params, { preserveState: true, replace: true });
    }

    const totalBalance = rows.reduce((sum, row) => sum + row.balance, 0);

    return (
        <>
            <Head title="Balance Analítico" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div>
                                <Label className="text-xs font-semibold uppercase tracking-wider block mb-1.5">Desde</Label>
                                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-40" />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold uppercase tracking-wider block mb-1.5">Hasta</Label>
                                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-40" />
                            </div>
                            <button onClick={handleFilter} className="px-4 py-2 h-9 bg-zinc-900 text-white text-sm rounded hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                                Filtrar
                            </button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {rows.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <p className="text-sm">No hay cuentas analíticas con movimientos en este periodo.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                            <th className="pb-2 pr-3 font-semibold">Código</th>
                                            <th className="pb-2 pr-3 font-semibold">Cuenta Analítica</th>
                                            <th className="pb-2 pr-3 font-semibold">Cuenta Contable</th>
                                            <th className="pb-2 pr-3 font-semibold text-right">Débito</th>
                                            <th className="pb-2 pr-3 font-semibold text-right">Crédito</th>
                                            <th className="pb-2 font-semibold text-right">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row) => (
                                            <tr key={row.analytical_account_id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="py-2.5 pr-3 font-mono text-xs font-semibold">{row.code}</td>
                                                <td className="py-2.5 pr-3 text-[13px]">{row.name}</td>
                                                <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                                                    {row.account_code ? <span><span className="font-mono">{row.account_code}</span> {row.account_name}</span> : '—'}
                                                </td>
                                                <td className="py-2.5 pr-3 text-xs font-mono text-right">{row.total_debit.toFixed(2)}</td>
                                                <td className="py-2.5 pr-3 text-xs font-mono text-right">{row.total_credit.toFixed(2)}</td>
                                                <td className="py-2.5 font-mono text-xs text-right">{row.balance.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        <tr className="border-t font-semibold bg-muted/50">
                                            <td colSpan={3} className="py-3 pr-3">TOTALES</td>
                                            <td className="py-3 pr-3 text-right">{totals.debit.toFixed(2)}</td>
                                            <td className="py-3 pr-3 text-right">{totals.credit.toFixed(2)}</td>
                                            <td className="py-3 text-right">{totalBalance.toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AnalyticalBalance.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Balance Analítico', href: '/accounting/reports/analytical-balance' },
    ],
};
