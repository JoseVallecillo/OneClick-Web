import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { useState } from 'react';

const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('es-HN') : '—';

const FREQ_LABELS: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };

interface Loan {
    id: number; loan_number: string; cycle_number: number; status: string; par_category: string;
    amount_requested: number; amount_approved?: number; disbursed_amount?: number;
    annual_rate: number; rate_calculation: string; payment_frequency: string; term_payments: number;
    principal_balance: string; interest_balance: string; late_fee_balance: string; total_balance: string;
    days_overdue: number; required_provision: string; purpose?: string;
    disbursed_at?: string; first_payment_date?: string; maturity_date?: string;
    origination_fee: string; insurance_total: string;
    client: { id: number; first_name: string; last_name: string; client_number: string; internal_score: number };
    product: { name: string };
    group?: { id: number; group_number: string; name: string; is_blocked: boolean };
    schedule: Array<{ id: number; installment_number: number; due_date: string; principal: number; interest: number; insurance: number; total_due: number; balance_after: number; status: string }>;
    payments: Array<{ id: number; payment_date: string; amount: number; principal_applied: number; interest_applied: number; late_fee_applied: number; payment_method: string; receipt_number: string }>;
    promises: Array<{ id: number; promise_date: string; promised_amount: number; status: string; contact_channel: string }>;
}
interface Props { loan: Loan }

const PAR_COLORS: Record<string, string> = {
    current: 'bg-green-100 text-green-800', par1: 'bg-yellow-100 text-yellow-800',
    par30: 'bg-orange-100 text-orange-800', par60: 'bg-red-100 text-red-800', par90: 'bg-red-200 text-red-900 font-bold',
};
const PROMISE_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700', kept: 'bg-green-100 text-green-700',
    broken: 'bg-red-100 text-red-700', partial: 'bg-orange-100 text-orange-700',
};

export default function LoanShow({ loan }: Props) {
    const [tab, setTab] = useState<'schedule' | 'payments' | 'promises'>('schedule');
    const [showPay, setShowPay] = useState(false);
    const [showDisburse, setShowDisburse] = useState(false);
    const [payAmount, setPayAmount] = useState('');
    const [payMethod, setPayMethod] = useState('cash');
    const [disburseData, setDisburseData] = useState({ disbursement_channel: 'cash', bank_name: '', account_number: '', transfer_reference: '', first_payment_date: '' });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Microfinanzas', href: '/microfinance' },
        { title: 'Cartera', href: '/microfinance/loans' },
        { title: loan.loan_number, href: '#' },
    ];

    const submitPay = () => router.post(`/microfinance/loans/${loan.id}/payment`, { amount: payAmount, payment_method: payMethod }, { onSuccess: () => { setShowPay(false); setPayAmount(''); } });
    const submitApprove = () => router.post(`/microfinance/loans/${loan.id}/approve`, { amount_approved: loan.amount_requested });
    const submitDisburse = () => router.post(`/microfinance/loans/${loan.id}/disburse`, disburseData, { onSuccess: () => setShowDisburse(false) });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold">{loan.loan_number}</h1>
                            <span className={`rounded px-1.5 py-0.5 text-xs ${PAR_COLORS[loan.par_category]}`}>
                                {loan.par_category === 'current' ? 'Al día' : loan.par_category.toUpperCase()}
                            </span>
                            {loan.group?.is_blocked && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">🔒 Grupo bloqueado</span>}
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">
                            <span className="cursor-pointer hover:underline" onClick={() => router.visit(`/microfinance/clients/${loan.client.id}`)}>
                                {loan.client.first_name} {loan.client.last_name}
                            </span>
                            {' · '}{loan.client.client_number} · Ciclo {loan.cycle_number} · {loan.product.name}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {loan.status === 'pending' && (
                            <button onClick={submitApprove} className="rounded bg-cyan-600 px-3 py-1.5 text-sm text-white hover:bg-cyan-700">Aprobar</button>
                        )}
                        {loan.status === 'approved' && (
                            <button onClick={() => setShowDisburse(true)} className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">Desembolsar</button>
                        )}
                        {['disbursed','current','delinquent'].includes(loan.status) && (
                            <button onClick={() => setShowPay(true)} className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-900">Registrar pago</button>
                        )}
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-5 gap-3">
                    {[
                        { label: 'Saldo capital', value: `L.${fmt(loan.principal_balance)}`, color: 'text-blue-600' },
                        { label: 'Interés', value: `L.${fmt(loan.interest_balance)}`, color: 'text-yellow-600' },
                        { label: 'Mora acum.', value: `L.${fmt(loan.late_fee_balance)}`, color: 'text-red-600' },
                        { label: 'Días mora', value: loan.days_overdue > 0 ? `+${loan.days_overdue}d` : '✓', color: loan.days_overdue > 0 ? 'text-red-600' : 'text-green-600' },
                        { label: 'Provisión req.', value: `L.${fmt(loan.required_provision)}`, color: 'text-gray-700' },
                    ].map(k => (
                        <div key={k.label} className="rounded-lg border bg-white p-3">
                            <p className="text-xs text-gray-400">{k.label}</p>
                            <p className={`mt-1 text-lg font-bold ${k.color}`}>{k.value}</p>
                        </div>
                    ))}
                </div>

                {/* Info strip */}
                <div className="rounded-lg border bg-white px-4 py-3 text-xs text-gray-600">
                    <div className="flex flex-wrap gap-5">
                        <span><span className="text-gray-400">Tasa: </span>{loan.annual_rate}% anual ({loan.rate_calculation === 'flat' ? 'flat' : 'saldos'})</span>
                        <span><span className="text-gray-400">Frecuencia: </span>{FREQ_LABELS[loan.payment_frequency]}</span>
                        <span><span className="text-gray-400">Plazo: </span>{loan.term_payments} cuotas</span>
                        <span><span className="text-gray-400">Desembolso: </span>{fmtDate(loan.disbursed_at ?? '')}</span>
                        <span><span className="text-gray-400">Vencimiento: </span>{fmtDate(loan.maturity_date ?? '')}</span>
                        <span><span className="text-gray-400">Comisión: </span>L.{fmt(loan.origination_fee)}</span>
                        {loan.purpose && <span><span className="text-gray-400">Destino: </span>{loan.purpose}</span>}
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b">
                    {(['schedule','payments','promises'] as const).map(t => {
                        const labels = { schedule: 'Plan de pagos', payments: 'Pagos realizados', promises: 'Promesas' };
                        return (
                            <button key={t} onClick={() => setTab(t)}
                                className={`px-4 py-2 text-sm ${tab === t ? 'border-b-2 border-black font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                                {labels[t]}
                            </button>
                        );
                    })}
                </div>

                {tab === 'schedule' && (
                    <div className="overflow-hidden rounded-lg border bg-white">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-3 py-3 text-center font-medium text-gray-500">#</th>
                                    <th className="px-3 py-3 text-left font-medium text-gray-500">Vence</th>
                                    <th className="px-3 py-3 text-right font-medium text-gray-500">Capital</th>
                                    <th className="px-3 py-3 text-right font-medium text-gray-500">Interés</th>
                                    <th className="px-3 py-3 text-right font-medium text-gray-500">Seguro</th>
                                    <th className="px-3 py-3 text-right font-medium text-gray-500 font-bold">Cuota</th>
                                    <th className="px-3 py-3 text-right font-medium text-gray-500">Saldo</th>
                                    <th className="px-3 py-3 text-center font-medium text-gray-500">Est.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loan.schedule.map(row => (
                                    <tr key={row.id} className={row.status === 'paid' ? 'bg-green-50' : row.status === 'overdue' ? 'bg-red-50' : ''}>
                                        <td className="px-3 py-2 text-center text-xs text-gray-400">{row.installment_number}</td>
                                        <td className="px-3 py-2 text-xs">{fmtDate(row.due_date)}</td>
                                        <td className="px-3 py-2 text-right text-xs">{fmt(row.principal)}</td>
                                        <td className="px-3 py-2 text-right text-xs">{fmt(row.interest)}</td>
                                        <td className="px-3 py-2 text-right text-xs">{fmt(row.insurance)}</td>
                                        <td className="px-3 py-2 text-right font-bold">{fmt(row.total_due)}</td>
                                        <td className="px-3 py-2 text-right text-xs text-gray-400">{fmt(row.balance_after)}</td>
                                        <td className="px-3 py-2 text-center">
                                            <span className={`rounded-full px-1.5 py-0.5 text-xs ${row.status === 'paid' ? 'bg-green-100 text-green-700' : row.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                                {row.status === 'paid' ? '✓' : row.status === 'overdue' ? 'Venc.' : 'Pend.'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === 'payments' && (
                    <div className="overflow-hidden rounded-lg border bg-white">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Fecha</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Recibo</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Total</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Capital</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Interés</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Mora</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Método</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loan.payments.map(p => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-3 text-xs">{fmtDate(p.payment_date)}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{p.receipt_number}</td>
                                        <td className="px-4 py-3 text-right font-bold">L.{fmt(p.amount)}</td>
                                        <td className="px-4 py-3 text-right text-xs">{fmt(p.principal_applied)}</td>
                                        <td className="px-4 py-3 text-right text-xs">{fmt(p.interest_applied)}</td>
                                        <td className="px-4 py-3 text-right text-xs text-red-500">{fmt(p.late_fee_applied)}</td>
                                        <td className="px-4 py-3 text-xs capitalize">{p.payment_method}</td>
                                    </tr>
                                ))}
                                {loan.payments.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">Sin pagos</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === 'promises' && (
                    <div className="space-y-2">
                        {loan.promises.map(p => (
                            <div key={p.id} className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
                                <div>
                                    <span className="text-sm font-medium">{fmtDate(p.promise_date)}</span>
                                    <span className="ml-3 text-xs text-gray-500">L.{fmt(p.promised_amount)} vía {p.contact_channel}</span>
                                </div>
                                <span className={`rounded-full px-2 py-0.5 text-xs ${PROMISE_COLORS[p.status]}`}>
                                    {p.status === 'kept' ? 'Cumplida' : p.status === 'broken' ? 'Incumplida' : p.status === 'partial' ? 'Parcial' : 'Pendiente'}
                                </span>
                            </div>
                        ))}
                        {loan.promises.length === 0 && <div className="rounded-lg border bg-white py-8 text-center text-gray-400">Sin promesas registradas</div>}
                    </div>
                )}
            </div>

            {/* Pay modal */}
            {showPay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-72 rounded-xl bg-white p-6 shadow-xl">
                        <h3 className="mb-4 font-semibold">Registrar pago</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Monto (L.)</label>
                                <input type="number" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Método</label>
                                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full rounded border px-3 py-2 text-sm">
                                    <option value="cash">Efectivo</option>
                                    <option value="transfer">Transferencia</option>
                                    <option value="mobile_wallet">Billetera móvil</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button onClick={() => setShowPay(false)} className="flex-1 rounded border py-2 text-sm hover:bg-gray-50">Cancelar</button>
                            <button onClick={submitPay} className="flex-1 rounded bg-black py-2 text-sm text-white hover:bg-gray-900">Aplicar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Disburse modal */}
            {showDisburse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-80 rounded-xl bg-white p-6 shadow-xl">
                        <h3 className="mb-4 font-semibold">Desembolso — L.{fmt(loan.amount_approved ?? loan.amount_requested)}</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Canal</label>
                                <select value={disburseData.disbursement_channel} onChange={e => setDisburseData(d => ({ ...d, disbursement_channel: e.target.value }))} className="w-full rounded border px-3 py-2 text-sm">
                                    <option value="cash">Efectivo</option>
                                    <option value="transfer">Transferencia</option>
                                    <option value="check">Cheque</option>
                                </select>
                            </div>
                            {disburseData.disbursement_channel !== 'cash' && (
                                <>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">Banco</label>
                                        <input type="text" value={disburseData.bank_name} onChange={e => setDisburseData(d => ({ ...d, bank_name: e.target.value }))} className="w-full rounded border px-3 py-2 text-sm focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">N° cuenta / referencia</label>
                                        <input type="text" value={disburseData.transfer_reference} onChange={e => setDisburseData(d => ({ ...d, transfer_reference: e.target.value }))} className="w-full rounded border px-3 py-2 text-sm focus:outline-none" />
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Fecha primer pago *</label>
                                <input type="date" value={disburseData.first_payment_date} onChange={e => setDisburseData(d => ({ ...d, first_payment_date: e.target.value }))} className="w-full rounded border px-3 py-2 text-sm" />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button onClick={() => setShowDisburse(false)} className="flex-1 rounded border py-2 text-sm hover:bg-gray-50">Cancelar</button>
                            <button onClick={submitDisburse} className="flex-1 rounded bg-green-600 py-2 text-sm text-white hover:bg-green-700">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
