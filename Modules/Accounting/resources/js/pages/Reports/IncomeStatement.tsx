import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface AccountRow {
    account_id: number;
    code: string;
    name: string;
    balance: number;
}

interface Props {
    income: AccountRow[];
    expenses: AccountRow[];
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    filters: { date_from?: string; date_to?: string };
}

export default function IncomeStatement({ income, expenses, totalIncome, totalExpenses, netIncome, filters }: Props) {
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]     = useState(filters.date_to ?? '');

    function handleFilter() {
        const params: Record<string, string> = {};
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        router.get('/accounting/reports/income-statement', params, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Estado de Resultados" />
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
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="bg-zinc-100 dark:bg-zinc-800">
                                        <td colSpan={2} className="py-2 px-3 font-bold">INGRESOS</td>
                                        <td className="py-2 px-3 font-bold text-right"></td>
                                    </tr>
                                    {income.map((row) => (
                                        <tr key={row.account_id} className="border-b">
                                            <td className="py-2 px-3 font-mono text-xs">{row.code}</td>
                                            <td className="py-2 px-3">{row.name}</td>
                                            <td className="py-2 px-3 text-right font-mono">{row.balance.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-green-50 dark:bg-green-950 font-semibold">
                                        <td colSpan={2} className="py-2 px-3">Total Ingresos</td>
                                        <td className="py-2 px-3 text-right font-mono">{totalIncome.toFixed(2)}</td>
                                    </tr>

                                    <tr className="bg-zinc-100 dark:bg-zinc-800">
                                        <td colSpan={2} className="py-2 px-3 font-bold">GASTOS</td>
                                        <td className="py-2 px-3 font-bold text-right"></td>
                                    </tr>
                                    {expenses.map((row) => (
                                        <tr key={row.account_id} className="border-b">
                                            <td className="py-2 px-3 font-mono text-xs">{row.code}</td>
                                            <td className="py-2 px-3">{row.name}</td>
                                            <td className="py-2 px-3 text-right font-mono">{Math.abs(row.balance).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-red-50 dark:bg-red-950 font-semibold">
                                        <td colSpan={2} className="py-2 px-3">Total Gastos</td>
                                        <td className="py-2 px-3 text-right font-mono">{Math.abs(totalExpenses).toFixed(2)}</td>
                                    </tr>

                                    <tr className={`${netIncome >= 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'} font-bold text-lg`}>
                                        <td colSpan={2} className="py-3 px-3">UTILIDAD NETA</td>
                                        <td className="py-3 px-3 text-right">{netIncome.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

IncomeStatement.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Estado de Resultados', href: '/accounting/reports/income-statement' },
    ],
};
