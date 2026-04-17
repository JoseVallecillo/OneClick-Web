import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Microfinanzas', href: '/microfinance' },
    { title: 'Cartera', href: '/microfinance/loans' },
    { title: 'Nueva solicitud', href: '#' },
];
const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const FREQ_LABELS: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };

interface Product { id: number; name: string; loan_type: string; annual_rate: number; rate_calculation: string; payment_frequency: string; min_amount: number; max_amount: number; min_term_payments: number; max_term_payments: number; origination_fee_type: string; origination_fee_value: number; insurance_pct: number; cycle_limits?: Array<{ cycle: number; max_amount: number }> }
interface Client { id: number; client_number: string; first_name: string; last_name: string; internal_score: number; monthly_payment_capacity: number; completed_cycles: number }
interface Group  { id: number; group_number: string; name: string; is_blocked: boolean; cycle_number: number }
interface Props  { products: Product[]; clients: Client[]; groups?: Group[] }

interface PreviewRow { installment_number: number; due_date: string; principal: number; interest: number; insurance: number; total_due: number; balance_after: number }

export default function LoanForm({ products, clients, groups = [] }: Props) {
    const [preview, setPreview] = useState<PreviewRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [product, setProduct] = useState<Product | null>(null);
    const [cycleLimit, setCycleLimit] = useState<number | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        client_id: '', product_id: '', group_id: '',
        amount_requested: '', term_payments: '', first_payment_date: '', purpose: '', collection_zone: '',
    });

    const onProductChange = (id: string) => {
        setData('product_id', id);
        const p = products.find(x => String(x.id) === id) ?? null;
        setProduct(p);
    };

    const onClientChange = (id: string) => {
        setData('client_id', id);
        const c = clients.find(x => String(x.id) === id);
        if (c && product) {
            const cl = product.cycle_limits?.find(l => l.cycle === c.completed_cycles + 1)?.max_amount ?? null;
            setCycleLimit(cl);
        }
    };

    const fetchPreview = async () => {
        if (!data.amount_requested || !data.term_payments || !product) return;
        setLoading(true);
        try {
            const p = new URLSearchParams({
                amount: data.amount_requested, annual_rate: String(product.annual_rate),
                term_payments: data.term_payments, rate_calculation: product.rate_calculation,
                payment_frequency: product.payment_frequency,
                first_payment_date: data.first_payment_date || new Date().toISOString().split('T')[0],
                insurance_pct: String(product.insurance_pct ?? 0),
            });
            const res = await fetch(`/microfinance/loans/amortization-preview?${p}`);
            setPreview(await res.json());
        } finally { setLoading(false); }
    };

    const fee = product ? (product.origination_fee_type === 'pct' ? Number(data.amount_requested) * product.origination_fee_value / 100 : product.origination_fee_value) : 0;
    const totalCost = preview.reduce((s, r) => s + r.total_due, 0);
    const firstInstallment = preview[0]?.total_due ?? 0;
    const selectedClient = clients.find(c => String(c.id) === data.client_id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <form onSubmit={e => { e.preventDefault(); post('/microfinance/loans'); }} className="mx-auto max-w-4xl space-y-5 p-4">
                <h1 className="text-xl font-semibold">Nueva solicitud de crédito</h1>

                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-4">
                        <div className="rounded-lg border bg-white p-4">
                            <h2 className="mb-4 text-sm font-semibold text-gray-700">Datos del crédito</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="mb-1 block text-xs font-medium text-gray-600">Cliente *</label>
                                    <select value={data.client_id} onChange={e => onClientChange(e.target.value)} required className="w-full rounded border px-3 py-2 text-sm">
                                        <option value="">Seleccionar...</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.client_number}) — Score: {c.internal_score} — Ciclo {c.completed_cycles + 1}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="mb-1 block text-xs font-medium text-gray-600">Producto *</label>
                                    <select value={data.product_id} onChange={e => onProductChange(e.target.value)} required className="w-full rounded border px-3 py-2 text-sm">
                                        <option value="">Seleccionar...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({FREQ_LABELS[p.payment_frequency]}, {p.annual_rate}%)</option>)}
                                    </select>
                                </div>
                                {groups.length > 0 && (
                                    <div className="col-span-2">
                                        <label className="mb-1 block text-xs font-medium text-gray-600">Grupo solidario</label>
                                        <select value={data.group_id} onChange={e => setData('group_id', e.target.value)} className="w-full rounded border px-3 py-2 text-sm">
                                            <option value="">Individual (sin grupo)</option>
                                            {groups.map(g => <option key={g.id} value={g.id} disabled={g.is_blocked}>{g.group_number} — {g.name}{g.is_blocked ? ' 🔒' : ''}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-600">Monto solicitado (L.) *</label>
                                    <input type="number" step="0.01" value={data.amount_requested} onChange={e => setData('amount_requested', e.target.value)} required
                                        min={product?.min_amount} max={cycleLimit ?? product?.max_amount}
                                        className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                                    {product && <p className="mt-0.5 text-xs text-gray-400">Rango: L.{fmt(product.min_amount)} – L.{fmt(cycleLimit ?? product.max_amount)}{cycleLimit ? ' (límite ciclo)' : ''}</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-600">N° cuotas *</label>
                                    <input type="number" value={data.term_payments} onChange={e => setData('term_payments', e.target.value)} required
                                        min={product?.min_term_payments} max={product?.max_term_payments}
                                        className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                                    {product && <p className="mt-0.5 text-xs text-gray-400">{product.min_term_payments}–{product.max_term_payments} cuotas {FREQ_LABELS[product.payment_frequency].toLowerCase()}s</p>}
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-600">Primer pago *</label>
                                    <input type="date" value={data.first_payment_date} onChange={e => setData('first_payment_date', e.target.value)} required className="w-full rounded border px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-600">Zona de cobro</label>
                                    <input type="text" value={data.collection_zone} onChange={e => setData('collection_zone', e.target.value)} className="w-full rounded border px-3 py-2 text-sm focus:outline-none" />
                                </div>
                                <div className="col-span-2">
                                    <label className="mb-1 block text-xs font-medium text-gray-600">Destino del crédito *</label>
                                    <input type="text" value={data.purpose} onChange={e => setData('purpose', e.target.value)} required className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                                </div>
                            </div>
                            <button type="button" onClick={fetchPreview} className="mt-4 rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
                                {loading ? 'Calculando...' : 'Ver plan de pagos'}
                            </button>
                        </div>

                        {/* Preview table */}
                        {preview.length > 0 && (
                            <div className="rounded-lg border bg-white">
                                <div className="border-b px-4 py-3">
                                    <p className="text-sm font-semibold">Plan de pagos</p>
                                    <p className="text-xs text-gray-400">Cuota: L.{fmt(firstInstallment)} {FREQ_LABELS[product?.payment_frequency ?? 'monthly'].toLowerCase()} · Costo total: L.{fmt(totalCost)}</p>
                                </div>
                                <div className="max-h-56 overflow-y-auto">
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 border-b bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-center">#</th>
                                                <th className="px-3 py-2 text-left">Vence</th>
                                                <th className="px-3 py-2 text-right">Capital</th>
                                                <th className="px-3 py-2 text-right">Interés</th>
                                                <th className="px-3 py-2 text-right font-bold">Cuota</th>
                                                <th className="px-3 py-2 text-right">Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {preview.map(r => (
                                                <tr key={r.installment_number}>
                                                    <td className="px-3 py-1.5 text-center text-gray-400">{r.installment_number}</td>
                                                    <td className="px-3 py-1.5">{new Date(r.due_date).toLocaleDateString('es-HN')}</td>
                                                    <td className="px-3 py-1.5 text-right">{fmt(r.principal)}</td>
                                                    <td className="px-3 py-1.5 text-right">{fmt(r.interest)}</td>
                                                    <td className="px-3 py-1.5 text-right font-bold">{fmt(r.total_due)}</td>
                                                    <td className="px-3 py-1.5 text-right text-gray-400">{fmt(r.balance_after)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary sidebar */}
                    <div className="space-y-4">
                        {selectedClient && (
                            <div className="rounded-lg border bg-white p-4 text-xs space-y-2">
                                <p className="font-semibold text-gray-700 mb-1">Perfil del cliente</p>
                                <div className="flex justify-between"><span className="text-gray-400">Score interno:</span><span className={`font-bold ${selectedClient.internal_score >= 70 ? 'text-green-600' : selectedClient.internal_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{selectedClient.internal_score}/100</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Cap. pago mensual:</span><span>L.{fmt(selectedClient.monthly_payment_capacity)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-400">Ciclos completados:</span><span>{selectedClient.completed_cycles}</span></div>
                                {firstInstallment > 0 && selectedClient.monthly_payment_capacity > 0 && (
                                    <div className="flex justify-between pt-1 border-t">
                                        <span className="text-gray-400">Ratio cuota/cap.:</span>
                                        <span className={`font-bold ${firstInstallment / selectedClient.monthly_payment_capacity < 0.4 ? 'text-green-600' : firstInstallment / selectedClient.monthly_payment_capacity < 0.7 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {(firstInstallment / selectedClient.monthly_payment_capacity * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                        {product && data.amount_requested && (
                            <div className="rounded-lg border bg-gray-50 p-4 text-xs space-y-1">
                                <p className="font-semibold text-gray-700 mb-2">Costos iniciales</p>
                                <div className="flex justify-between"><span className="text-gray-500">Comisión apertura:</span><span className="font-medium">L.{fmt(fee)}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Seguro ({product.insurance_pct}%/cuota):</span><span className="font-medium">L.{fmt(Number(data.amount_requested) * product.insurance_pct / 100)}</span></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => router.visit('/microfinance/loans')} className="rounded border px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
                    <button type="submit" disabled={processing} className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-50">Guardar solicitud</button>
                </div>
            </form>
        </AppLayout>
    );
}
