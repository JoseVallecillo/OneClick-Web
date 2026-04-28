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
    assets: AccountRow[];
    liabilities: AccountRow[];
    equity: AccountRow[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    filters: { date_as?: string };
}

export default function BalanceSheet({ assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity, filters }: Props) {
    const [dateAs, setDateAs] = useState(filters.date_as ?? '');

    function handleFilter() {
        const params: Record<string, string> = {};
        if (dateAs) params.date_as = dateAs;
        router.get('/accounting/reports/balance-sheet', params, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Balance General" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div>
                                <Label className="text-xs font-semibold uppercase tracking-wider block mb-1.5">Al</Label>
                                <Input type="date" value={dateAs} onChange={(e) => setDateAs(e.target.value)} className="h-9 w-40" />
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
                                        <td colSpan={2} className="py-2 px-3 font-bold">ACTIVOS</td>
                                        <td className="py-2 px-3 font-bold text-right"></td>
                                    </tr>
                                    {assets.map((row) => (
                                        <tr key={row.account_id} className="border-b">
                                            <td className="py-2 px-3 font-mono text-xs">{row.code}</td>
                                            <td className="py-2 px-3">{row.name}</td>
                                            <td className="py-2 px-3 text-right font-mono">{row.balance.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-blue-50 dark:bg-blue-950 font-semibold">
                                        <td colSpan={2} className="py-2 px-3">Total Activos</td>
                                        <td className="py-2 px-3 text-right font-mono">{totalAssets.toFixed(2)}</td>
                                    </tr>

                                    <tr className="bg-zinc-100 dark:bg-zinc-800 mt-4">
                                        <td colSpan={2} className="py-2 px-3 font-bold">PASIVOS</td>
                                        <td className="py-2 px-3 font-bold text-right"></td>
                                    </tr>
                                    {liabilities.map((row) => (
                                        <tr key={row.account_id} className="border-b">
                                            <td className="py-2 px-3 font-mono text-xs">{row.code}</td>
                                            <td className="py-2 px-3">{row.name}</td>
                                            <td className="py-2 px-3 text-right font-mono">{row.balance.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-red-50 dark:bg-red-950 font-semibold">
                                        <td colSpan={2} className="py-2 px-3">Total Pasivos</td>
                                        <td className="py-2 px-3 text-right font-mono">{totalLiabilities.toFixed(2)}</td>
                                    </tr>

                                    <tr className="bg-zinc-100 dark:bg-zinc-800">
                                        <td colSpan={2} className="py-2 px-3 font-bold">PATRIMONIO</td>
                                        <td className="py-2 px-3 font-bold text-right"></td>
                                    </tr>
                                    {equity.map((row) => (
                                        <tr key={row.account_id} className="border-b">
                                            <td className="py-2 px-3 font-mono text-xs">{row.code}</td>
                                            <td className="py-2 px-3">{row.name}</td>
                                            <td className="py-2 px-3 text-right font-mono">{row.balance.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-green-50 dark:bg-green-950 font-semibold">
                                        <td colSpan={2} className="py-2 px-3">Total Patrimonio</td>
                                        <td className="py-2 px-3 text-right font-mono">{totalEquity.toFixed(2)}</td>
                                    </tr>

                                    <tr className="bg-zinc-200 dark:bg-zinc-700 font-bold text-lg">
                                        <td colSpan={2} className="py-3 px-3">PASIVOS + PATRIMONIO</td>
                                        <td className="py-3 px-3 text-right">{(totalLiabilities + totalEquity).toFixed(2)}</td>
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

BalanceSheet.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Balance General', href: '/accounting/reports/balance-sheet' },
    ],
};
