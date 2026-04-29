import { type BreadcrumbItem } from '@/types';
import { Head,  router  } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Microfinanzas', href: '/microfinance' },
    { title: 'Arqueo de cartera', href: '#' },
];
const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface ReconciliationItem {
    id: number; expected_amount: number; collected_amount: number; difference: number; status: string;
    loan: { loan_number: string; client: { first_name: string; last_name: string } };
}
interface Reconciliation {
    id: number; reconciliation_date: string; status: string; total_expected: number; total_collected: number;
    total_difference: number; items: ReconciliationItem[];
}
interface Props { reconciliation: Reconciliation | null; date: string }

const STATUS_COLOR: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600', verified: 'bg-green-100 text-green-700', discrepancy: 'bg-red-100 text-red-700',
};

export default function TreasuryReconciliation({ reconciliation, date }: Props) {
    const [amounts, setAmounts] = useState<Record<number, string>>({});

    const setAmount = (id: number, val: string) => setAmounts(prev => ({ ...prev, [id]: val }));

    const save = (itemId: number) => {
        router.patch(`/microfinance/treasury/reconciliation-items/${itemId}`, { collected_amount: amounts[itemId] ?? '' },
            { preserveState: true });
    };

    const verify = () => {
        if (!reconciliation) return;
        router.post(`/microfinance/treasury/reconciliations/${reconciliation.id}/verify`);
    };

    const create = () => router.post('/microfinance/treasury/reconciliations', { date });

    const diff = reconciliation ? reconciliation.total_collected - reconciliation.total_expected : 0;

    return (
        <>
            <Head title="Microfinanzas" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Arqueo de cartera</h1>
                        <p className="text-sm text-gray-400">{new Date(date + 'T12:00:00').toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                    {!reconciliation && (
                        <button onClick={create} className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-900">Iniciar arqueo</button>
                    )}
                    {reconciliation?.status === 'draft' && (
                        <button onClick={verify} className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">Verificar arqueo</button>
                    )}
                </div>

                {!reconciliation && (
                    <div className="flex flex-1 items-center justify-center text-gray-400">
                        <p>No hay arqueo para esta fecha. Inicia uno nuevo.</p>
                    </div>
                )}

                {reconciliation && (
                    <>
                        {/* Summary */}
                        <div className="grid grid-cols-4 gap-3">
                            <div className="rounded-lg border bg-white p-3">
                                <p className="text-xs text-gray-400">Esperado</p>
                                <p className="mt-1 text-xl font-bold">L.{fmt(reconciliation.total_expected)}</p>
                            </div>
                            <div className="rounded-lg border bg-white p-3">
                                <p className="text-xs text-gray-400">Cobrado</p>
                                <p className="mt-1 text-xl font-bold text-green-600">L.{fmt(reconciliation.total_collected)}</p>
                            </div>
                            <div className="rounded-lg border bg-white p-3">
                                <p className="text-xs text-gray-400">Diferencia</p>
                                <p className={`mt-1 text-xl font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {diff >= 0 ? '+' : ''}L.{fmt(diff)}
                                </p>
                            </div>
                            <div className="rounded-lg border bg-white p-3">
                                <p className="text-xs text-gray-400">Estado</p>
                                <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[reconciliation.status]}`}>
                                    {reconciliation.status === 'draft' ? 'Borrador' : reconciliation.status === 'verified' ? 'Verificado' : 'Discrepancia'}
                                </span>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="overflow-hidden rounded-lg border bg-white">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">Cliente</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500">N° Crédito</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Esperado</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Cobrado</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500">Diferencia</th>
                                        {reconciliation.status === 'draft' && <th className="px-4 py-3"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {reconciliation.items.map(item => (
                                        <tr key={item.id} className={item.difference < -0.01 ? 'bg-red-50/30' : item.difference > 0.01 ? 'bg-green-50/20' : ''}>
                                            <td className="px-4 py-3 font-medium">
                                                {item.loan.client.first_name} {item.loan.client.last_name}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">{item.loan.loan_number}</td>
                                            <td className="px-4 py-3 text-right">L.{fmt(item.expected_amount)}</td>
                                            <td className="px-4 py-3 text-right">
                                                {reconciliation.status === 'draft' ? (
                                                    <input type="number" step="0.01"
                                                        value={amounts[item.id] ?? item.collected_amount}
                                                        onChange={e => setAmount(item.id, e.target.value)}
                                                        className="w-28 rounded border px-2 py-1 text-right text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                                                ) : (
                                                    <span className="font-medium text-green-700">L.{fmt(item.collected_amount)}</span>
                                                )}
                                            </td>
                                            <td className={`px-4 py-3 text-right font-bold ${item.difference < -0.01 ? 'text-red-600' : item.difference > 0.01 ? 'text-green-600' : 'text-gray-400'}`}>
                                                {item.difference >= 0 ? '+' : ''}L.{fmt(item.difference)}
                                            </td>
                                            {reconciliation.status === 'draft' && (
                                                <td className="px-4 py-3">
                                                    <button onClick={() => save(item.id)}
                                                        className="rounded border px-2 py-1 text-xs hover:bg-gray-50">Guardar</button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                    {reconciliation.items.length === 0 && (
                                        <tr><td colSpan={6} className="py-10 text-center text-gray-400">Sin items</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

TreasuryReconciliation.layout = { breadcrumbs };
