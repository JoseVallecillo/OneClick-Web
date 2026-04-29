import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

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

interface AnalyticalAccountOption {
    id: number;
    code: string;
    name: string;
}

interface Props {
    lines: LedgerLine[];
    analyticalAccount: { id: number; code: string; name: string } | null;
    analyticalAccounts: AnalyticalAccountOption[];
    filters: { analytical_account_id?: string; date_from?: string; date_to?: string };
}

export default function AnalyticalLedger({ lines, analyticalAccount, analyticalAccounts, filters }: Props) {
    const [analyticalAccountId, setAnalyticalAccountId] = useState(filters.analytical_account_id ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]     = useState(filters.date_to ?? '');

    function handleFilter() {
        const params: Record<string, string> = {};
        if (analyticalAccountId) params.analytical_account_id = analyticalAccountId;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        router.get('/accounting/reports/analytical-ledger', params, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Mayor Analítico" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div>
                                <Label className="text-xs font-semibold uppercase tracking-wider block mb-1.5">Cuenta Analítica</Label>
                                <Select value={analyticalAccountId} onValueChange={setAnalyticalAccountId}>
                                    <SelectTrigger className="h-9 w-64 text-sm">
                                        <SelectValue placeholder="Seleccionar cuenta…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {analyticalAccounts.map((a) => (
                                            <SelectItem key={a.id} value={String(a.id)} className="text-xs">
                                                <span className="font-mono mr-2">{a.code}</span>{a.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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
                        {!analyticalAccount ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <p className="text-sm">Selecciona una cuenta analítica para ver su mayor.</p>
                            </div>
                        ) : lines.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <p className="text-sm">No hay movimientos para esta cuenta en el periodo seleccionado.</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 p-3 rounded bg-muted/50 text-sm">
                                    <span className="font-mono font-semibold">{analyticalAccount.code}</span> — {analyticalAccount.name}
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                                <th className="pb-2 pr-3 font-semibold">Fecha</th>
                                                <th className="pb-2 pr-3 font-semibold">Referencia</th>
                                                <th className="pb-2 pr-3 font-semibold">Diario</th>
                                                <th className="pb-2 pr-3 font-semibold">Descripción</th>
                                                <th className="pb-2 pr-3 font-semibold">Tercero</th>
                                                <th className="pb-2 pr-3 font-semibold text-right">Débito</th>
                                                <th className="pb-2 pr-3 font-semibold text-right">Crédito</th>
                                                <th className="pb-2 font-semibold text-right">Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lines.map((line, i) => (
                                                <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                                                    <td className="py-2.5 pr-3 font-mono text-xs">{line.date}</td>
                                                    <td className="py-2.5 pr-3 font-mono text-xs">{line.reference}</td>
                                                    <td className="py-2.5 pr-3 text-xs">{line.journal}</td>
                                                    <td className="py-2.5 pr-3 text-xs">{line.narration || '—'}</td>
                                                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">{line.partner || '—'}</td>
                                                    <td className="py-2.5 pr-3 text-xs font-mono text-right">{line.debit.toFixed(2)}</td>
                                                    <td className="py-2.5 pr-3 text-xs font-mono text-right">{line.credit.toFixed(2)}</td>
                                                    <td className="py-2.5 font-mono text-xs text-right">{line.balance.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AnalyticalLedger.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Mayor Analítico', href: '/accounting/reports/analytical-ledger' },
    ],
};
