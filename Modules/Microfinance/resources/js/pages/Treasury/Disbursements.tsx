import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Microfinanzas', href: '/microfinance' },
    { title: 'Desembolsos', href: '#' },
];
const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface PendingLoan {
    id: number; loan_number: string; amount_approved: number;
    client: { first_name: string; last_name: string; client_number: string };
    product: { name: string; payment_frequency: string };
    group?: { group_number: string; name: string };
}
interface Disbursement {
    id: number; disbursement_date: string; amount: number; channel: string; reference_number?: string;
    loan: { loan_number: string; client: { first_name: string; last_name: string } };
}
interface Props { pending: PendingLoan[]; disbursements: { data: Disbursement[] } }

const CHANNEL_LABELS: Record<string, string> = { cash: 'Efectivo', transfer: 'Transferencia', check: 'Cheque' };

export default function TreasuryDisbursements({ pending, disbursements }: Props) {
    const [selected, setSelected] = useState<PendingLoan | null>(null);
    const { data, setData, post, processing, reset } = useForm({
        channel: 'cash', reference_number: '', bank_name: '', account_number: '', disbursement_date: new Date().toISOString().split('T')[0],
    });

    const submit = () => {
        if (!selected) return;
        router.post(`/microfinance/loans/${selected.id}/disburse`, data as any,
            { onSuccess: () => { setSelected(null); reset(); } });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-xl font-semibold">Desembolsos</h1>

                {pending.length > 0 && (
                    <div>
                        <p className="mb-2 px-1 text-xs font-semibold uppercase text-gray-400">Créditos aprobados — pendientes de desembolso ({pending.length})</p>
                        <div className="space-y-2">
                            {pending.map(loan => (
                                <div key={loan.id} className="rounded-xl border-2 border-green-200 bg-green-50/30 p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold">{loan.client.first_name} {loan.client.last_name}</p>
                                            <p className="text-xs text-gray-500">{loan.loan_number} · {loan.product.name}</p>
                                            {loan.group && <p className="text-xs text-gray-400">Grupo: {loan.group.name}</p>}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-green-700">L.{fmt(loan.amount_approved)}</p>
                                            <button onClick={() => { setSelected(loan); reset(); }}
                                                className="mt-1 rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-900">
                                                Desembolsar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <p className="mb-2 px-1 text-xs font-semibold uppercase text-gray-400">Historial de desembolsos</p>
                    <div className="overflow-hidden rounded-lg border bg-white">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Fecha</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Cliente</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">N° Crédito</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500">Canal</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Monto</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Referencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {disbursements.data.map(d => (
                                    <tr key={d.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm">{new Date(d.disbursement_date).toLocaleDateString('es-HN')}</td>
                                        <td className="px-4 py-3 font-medium">{d.loan.client.first_name} {d.loan.client.last_name}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{d.loan.loan_number}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{CHANNEL_LABELS[d.channel] ?? d.channel}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-green-700">L.{fmt(d.amount)}</td>
                                        <td className="px-4 py-3 text-xs text-gray-400">{d.reference_number ?? '—'}</td>
                                    </tr>
                                ))}
                                {disbursements.data.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-gray-400">Sin desembolsos</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="mb-1 font-semibold">Registrar desembolso</h3>
                        <p className="mb-4 text-sm text-gray-500">{selected.client.first_name} {selected.client.last_name} — L.{fmt(selected.amount_approved)}</p>

                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Canal</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['cash','transfer','check'].map(c => (
                                        <button key={c} type="button" onClick={() => setData('channel', c)}
                                            className={`rounded-lg py-2 text-xs font-medium ${data.channel === c ? 'bg-black text-white' : 'border hover:bg-gray-50'}`}>
                                            {CHANNEL_LABELS[c]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Fecha de desembolso</label>
                                <input type="date" value={data.disbursement_date} onChange={e => setData('disbursement_date', e.target.value)}
                                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none" />
                            </div>
                            {data.channel !== 'cash' && (
                                <>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">Banco</label>
                                        <input type="text" value={data.bank_name} onChange={e => setData('bank_name', e.target.value)}
                                            className="w-full rounded border px-3 py-2 text-sm focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">N° cuenta / cheque</label>
                                        <input type="text" value={data.account_number} onChange={e => setData('account_number', e.target.value)}
                                            className="w-full rounded border px-3 py-2 text-sm focus:outline-none" />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">N° referencia (opcional)</label>
                                <input type="text" value={data.reference_number} onChange={e => setData('reference_number', e.target.value)}
                                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none" />
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button onClick={() => setSelected(null)} className="flex-1 rounded-xl border py-2.5 text-sm font-medium hover:bg-gray-50">Cancelar</button>
                            <button onClick={submit} disabled={processing}
                                className="flex-1 rounded-xl bg-black py-2.5 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
