import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface BudgetLine {
    account_id: number;
    code: string;
    name: string;
    budgeted: number;
    actual: number;
    variance: number;
    variance_percent: number;
}

interface BudgetOption {
    id: number;
    name: string;
    date_from: string;
    date_to: string;
}

interface Props {
    budget: { id: number; name: string; date_from: string; date_to: string } | null;
    budgets: BudgetOption[];
    lines: BudgetLine[];
    filters: { budget_id?: string };
}

export default function BudgetVsActual({ budget, budgets, lines, filters }: Props) {
    const [budgetId, setBudgetId] = useState(filters.budget_id ?? '');

    function handleFilter() {
        const params: Record<string, string> = {};
        if (budgetId) params.budget_id = budgetId;
        router.get('/accounting/reports/budget-vs-actual', params, { preserveState: true, replace: true });
    }

    const totalBudgeted = lines.reduce((sum, line) => sum + line.budgeted, 0);
    const totalActual = lines.reduce((sum, line) => sum + line.actual, 0);
    const totalVariance = totalBudgeted - totalActual;

    return (
        <>
            <Head title="Presupuesto vs Real" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5">Presupuesto</label>
                                <Select value={budgetId} onValueChange={setBudgetId}>
                                    <SelectTrigger className="h-9 w-64 text-sm">
                                        <SelectValue placeholder="Seleccionar presupuesto…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {budgets.map((b) => (
                                            <SelectItem key={b.id} value={String(b.id)}>
                                                {b.name} ({b.date_from} a {b.date_to})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <button onClick={handleFilter} className="px-4 py-2 h-9 bg-zinc-900 text-white text-sm rounded hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                                Filtrar
                            </button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {!budget ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <p className="text-sm">Selecciona un presupuesto para ver el análisis.</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 p-3 rounded bg-muted/50 text-sm">
                                    <span className="font-semibold">{budget.name}</span> ({budget.date_from} a {budget.date_to})
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                                <th className="pb-2 pr-3 font-semibold">Código</th>
                                                <th className="pb-2 pr-3 font-semibold">Cuenta</th>
                                                <th className="pb-2 pr-3 font-semibold text-right">Presupuesto</th>
                                                <th className="pb-2 pr-3 font-semibold text-right">Real</th>
                                                <th className="pb-2 pr-3 font-semibold text-right">Variancia</th>
                                                <th className="pb-2 font-semibold text-right">%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lines.map((line) => (
                                                <tr key={line.account_id} className="border-b last:border-0 hover:bg-muted/30">
                                                    <td className="py-2.5 pr-3 font-mono text-xs">{line.code}</td>
                                                    <td className="py-2.5 pr-3">{line.name}</td>
                                                    <td className="py-2.5 pr-3 text-right font-mono text-xs">{line.budgeted.toFixed(2)}</td>
                                                    <td className="py-2.5 pr-3 text-right font-mono text-xs">{line.actual.toFixed(2)}</td>
                                                    <td className="py-2.5 pr-3 text-right font-mono text-xs">{line.variance.toFixed(2)}</td>
                                                    <td className="py-2.5 text-right text-xs">{line.variance_percent.toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                            <tr className="border-t font-semibold bg-muted/50">
                                                <td colSpan={2} className="py-3 pr-3">TOTALES</td>
                                                <td className="py-3 pr-3 text-right">{totalBudgeted.toFixed(2)}</td>
                                                <td className="py-3 pr-3 text-right">{totalActual.toFixed(2)}</td>
                                                <td className="py-3 pr-3 text-right">{totalVariance.toFixed(2)}</td>
                                                <td className="py-3 text-right">
                                                    {totalBudgeted > 0 ? ((totalVariance / totalBudgeted) * 100).toFixed(1) : 0}%
                                                </td>
                                            </tr>
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

BudgetVsActual.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Presupuesto vs Real', href: '/accounting/reports/budget-vs-actual' },
    ],
};
