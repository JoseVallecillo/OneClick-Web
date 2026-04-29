import { type BreadcrumbItem } from '@/types';
import { Head,  router, useForm  } from '@inertiajs/react';
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
        <>
            <Head title="Microfinanzas" />
            <div className="bg-[#f8fafc] min-h-full">
                <form onSubmit={e => { e.preventDefault(); post('/microfinance/loans'); }} className="mx-auto max-w-5xl space-y-6 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Nueva solicitud de crédito</h1>
                            <p className="text-sm text-slate-500 mt-1">Complete los datos para generar la tabla de amortización.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-6 text-lg font-bold text-slate-900 border-b pb-4">Datos del Crédito</h2>
                            <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Cliente *</label>
                                        <select value={data.client_id} onChange={e => onClientChange(e.target.value)} required className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                                            <option value="">Seleccionar...</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.client_number}) — Score: {c.internal_score} — Ciclo {c.completed_cycles + 1}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Producto *</label>
                                        <select value={data.product_id} onChange={e => onProductChange(e.target.value)} required className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                                            <option value="">Seleccionar...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({FREQ_LABELS[p.payment_frequency]}, {p.annual_rate}%)</option>)}
                                        </select>
                                    </div>
                                    {groups.length > 0 && (
                                        <div className="col-span-2">
                                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Grupo solidario</label>
                                            <select value={data.group_id} onChange={e => setData('group_id', e.target.value)} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors">
                                                <option value="">Individual (sin grupo)</option>
                                                {groups.map(g => <option key={g.id} value={g.id} disabled={g.is_blocked}>{g.group_number} — {g.name}{g.is_blocked ? ' 🔒' : ''}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Monto solicitado (L.) *</label>
                                        <input type="number" step="0.01" value={data.amount_requested} onChange={e => setData('amount_requested', e.target.value)} required
                                            min={product?.min_amount} max={cycleLimit ?? product?.max_amount}
                                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" />
                                        {product && <p className="mt-1.5 text-xs font-medium text-indigo-600">Rango: L.{fmt(product.min_amount)} – L.{fmt(cycleLimit ?? product.max_amount)}{cycleLimit ? ' (límite ciclo)' : ''}</p>}
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">N° cuotas *</label>
                                        <input type="number" value={data.term_payments} onChange={e => setData('term_payments', e.target.value)} required
                                            min={product?.min_term_payments} max={product?.max_term_payments}
                                            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" />
                                        {product && <p className="mt-1.5 text-xs font-medium text-slate-500">{product.min_term_payments}–{product.max_term_payments} cuotas {FREQ_LABELS[product.payment_frequency].toLowerCase()}s</p>}
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Primer pago *</label>
                                        <input type="date" value={data.first_payment_date} onChange={e => setData('first_payment_date', e.target.value)} required className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Zona de cobro</label>
                                        <input type="text" value={data.collection_zone} onChange={e => setData('collection_zone', e.target.value)} className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Destino del crédito *</label>
                                        <input type="text" value={data.purpose} onChange={e => setData('purpose', e.target.value)} required className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors" />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button type="button" onClick={fetchPreview} className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                                        {loading ? 'Calculando...' : 'Ver plan de pagos'}
                                    </button>
                                </div>
                            </div>

                            {/* Preview table */}
                            {preview.length > 0 && (
                                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Plan de pagos</p>
                                            <p className="text-xs font-medium text-slate-500 mt-1">Estimación según parámetros del producto</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900">L.{fmt(totalCost)}</p>
                                            <p className="text-xs font-medium text-emerald-600 mt-1">Cuota: L.{fmt(firstInstallment)}</p>
                                        </div>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-white border-b border-slate-100 shadow-sm z-10">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">No.</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Vencimiento</th>
                                                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Capital</th>
                                                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Interés</th>
                                                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-900">Cuota</th>
                                                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Saldo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {preview.map(r => (
                                                    <tr key={r.installment_number} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-3 text-slate-500 font-medium">{r.installment_number}</td>
                                                        <td className="px-6 py-3 font-medium text-slate-700">{new Date(r.due_date).toLocaleDateString('es-HN')}</td>
                                                        <td className="px-6 py-3 text-right text-slate-600">{fmt(r.principal)}</td>
                                                        <td className="px-6 py-3 text-right text-slate-600">{fmt(r.interest)}</td>
                                                        <td className="px-6 py-3 text-right font-bold text-slate-900">{fmt(r.total_due)}</td>
                                                        <td className="px-6 py-3 text-right text-slate-400">{fmt(r.balance_after)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Summary sidebar */}
                        <div className="space-y-6">
                            {selectedClient && (
                                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                                    <h3 className="font-bold text-slate-900 border-b pb-3">Perfil Analítico</h3>
                                    
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Score Interno</span>
                                            <span className={`text-sm font-black ${selectedClient.internal_score >= 70 ? 'text-emerald-500' : selectedClient.internal_score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{selectedClient.internal_score}/100</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
                                            <div className={`h-1.5 rounded-full ${selectedClient.internal_score >= 70 ? 'bg-emerald-500' : selectedClient.internal_score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${selectedClient.internal_score}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Dspl. Mensual</span>
                                        <span className="text-sm font-bold text-slate-900">L.{fmt(selectedClient.monthly_payment_capacity)}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Ciclos Completados</span>
                                        <span className="text-sm font-bold text-slate-900">{selectedClient.completed_cycles}</span>
                                    </div>

                                    {firstInstallment > 0 && selectedClient.monthly_payment_capacity > 0 && (
                                        <div className="pt-4 border-t mt-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Impacto Cuota</span>
                                                <span className={`text-sm font-black ${firstInstallment / selectedClient.monthly_payment_capacity < 0.4 ? 'text-emerald-500' : firstInstallment / selectedClient.monthly_payment_capacity < 0.7 ? 'text-amber-500' : 'text-red-500'}`}>
                                                    {(firstInstallment / selectedClient.monthly_payment_capacity * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                <div className={`h-1.5 rounded-full ${firstInstallment / selectedClient.monthly_payment_capacity < 0.4 ? 'bg-emerald-500' : firstInstallment / selectedClient.monthly_payment_capacity < 0.7 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, firstInstallment / selectedClient.monthly_payment_capacity * 100)}%` }}></div>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-2 text-right">Mide el peso de la cuota vs ingresos netos.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {product && data.amount_requested && (
                                <div className="rounded-3xl bg-indigo-50 border border-indigo-100 p-6 space-y-4">
                                    <h3 className="font-bold text-indigo-900 border-b border-indigo-200 pb-3">Cargos Adicionales</h3>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600/70">Comisión Apertura</span>
                                        <span className="text-sm font-bold text-indigo-900">L.{fmt(fee)}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600/70">Seguro Vida ({product.insurance_pct}%)</span>
                                        <span className="text-sm font-bold text-indigo-900">L.{fmt(Number(data.amount_requested) * product.insurance_pct / 100)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                        <button type="button" onClick={() => router.visit('/microfinance/loans')} className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all">Cancelar</button>
                        <button type="submit" disabled={processing} className="rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all">Generar Solicitud</button>
                    </div>
                </form>
            </div>
        </>
    );
}

LoanForm.layout = { breadcrumbs };
