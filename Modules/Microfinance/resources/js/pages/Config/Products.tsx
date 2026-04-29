import { type BreadcrumbItem } from '@/types';
import { Head,  router, useForm  } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Microfinanzas', href: '/microfinance' },
    { title: 'Productos de crédito', href: '#' },
];
const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface CycleLimit { cycle: number; max_amount: number }
interface Product {
    id: number; name: string; loan_type: string; annual_rate: number; rate_calculation: string;
    payment_frequency: string; min_amount: number; max_amount: number; min_term_payments: number;
    max_term_payments: number; origination_fee_type: string; origination_fee_value: number;
    insurance_pct: number; late_fee_type: string; late_fee_value: number; is_active: boolean;
    cycle_limits?: CycleLimit[];
}
interface Props { products: Product[] }

const FREQ_LABELS: Record<string, string> = { weekly: 'Semanal', biweekly: 'Quincenal', monthly: 'Mensual' };
const TYPE_LABELS: Record<string, string> = { individual: 'Individual', solidary_group: 'Grupo solidario' };

type FormData = {
    name: string; loan_type: string; annual_rate: string; rate_calculation: string;
    payment_frequency: string; min_amount: string; max_amount: string;
    min_term_payments: string; max_term_payments: string;
    origination_fee_type: string; origination_fee_value: string;
    insurance_pct: string; late_fee_type: string; late_fee_value: string;
};

export default function ConfigProducts({ products }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [cycleLimits, setCycleLimits] = useState<CycleLimit[]>([]);

    const { data, setData, post, patch, processing, reset, errors } = useForm<FormData>({
        name: '', loan_type: 'individual', annual_rate: '', rate_calculation: 'declining',
        payment_frequency: 'monthly', min_amount: '', max_amount: '',
        min_term_payments: '', max_term_payments: '',
        origination_fee_type: 'pct', origination_fee_value: '',
        insurance_pct: '0', late_fee_type: 'daily_pct', late_fee_value: '',
    });

    const openCreate = () => { reset(); setCycleLimits([]); setEditing(null); setShowModal(true); };
    const openEdit = (p: Product) => {
        setEditing(p);
        setData({
            name: p.name, loan_type: p.loan_type, annual_rate: String(p.annual_rate),
            rate_calculation: p.rate_calculation, payment_frequency: p.payment_frequency,
            min_amount: String(p.min_amount), max_amount: String(p.max_amount),
            min_term_payments: String(p.min_term_payments), max_term_payments: String(p.max_term_payments),
            origination_fee_type: p.origination_fee_type, origination_fee_value: String(p.origination_fee_value),
            insurance_pct: String(p.insurance_pct), late_fee_type: p.late_fee_type, late_fee_value: String(p.late_fee_value),
        });
        setCycleLimits(p.cycle_limits ?? []);
        setShowModal(true);
    };

    const submit = () => {
        const payload = { ...data, cycle_limits: cycleLimits };
        if (editing) {
            router.patch(`/microfinance/config/products/${editing.id}`, payload as any,
                { onSuccess: () => { setShowModal(false); reset(); } });
        } else {
            router.post('/microfinance/config/products', payload as any,
                { onSuccess: () => { setShowModal(false); reset(); } });
        }
    };

    const addCycleLimit = () => {
        const next = (cycleLimits[cycleLimits.length - 1]?.cycle ?? 0) + 1;
        setCycleLimits([...cycleLimits, { cycle: next, max_amount: 0 }]);
    };
    const updateCycleLimit = (i: number, field: keyof CycleLimit, val: string) => {
        setCycleLimits(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: Number(val) } : l));
    };
    const removeCycleLimit = (i: number) => setCycleLimits(prev => prev.filter((_, idx) => idx !== i));

    const toggle = (id: number) => router.patch(`/microfinance/config/products/${id}/toggle`);

    return (
        <>
            <Head title="Microfinanzas" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Productos de crédito</h1>
                    <button onClick={openCreate} className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-900">+ Nuevo producto</button>
                </div>

                <div className="overflow-hidden rounded-lg border bg-white">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Producto</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Tipo</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Tasa anual</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Cálculo</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Frecuencia</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500">Monto</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Estado</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {products.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{p.name}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{TYPE_LABELS[p.loan_type] ?? p.loan_type}</td>
                                    <td className="px-4 py-3 text-center font-bold">{p.annual_rate}%</td>
                                    <td className="px-4 py-3 text-center text-xs">
                                        <span className={`rounded px-1.5 py-0.5 ${p.rate_calculation === 'flat' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {p.rate_calculation === 'flat' ? 'Add-on' : 'Francés'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs">{FREQ_LABELS[p.payment_frequency]}</td>
                                    <td className="px-4 py-3 text-right text-xs">L.{fmt(p.min_amount)} – L.{fmt(p.max_amount)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => toggle(p.id)}
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {p.is_active ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => openEdit(p)} className="text-xs text-blue-500 hover:text-blue-700">Editar</button>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-gray-400">Sin productos</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="mb-4 font-semibold">{editing ? 'Editar producto' : 'Nuevo producto'}</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="mb-1 block text-xs font-medium text-gray-600">Nombre *</label>
                                <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Tipo de crédito</label>
                                <select value={data.loan_type} onChange={e => setData('loan_type', e.target.value)} className="w-full rounded border px-3 py-2 text-sm">
                                    <option value="individual">Individual</option>
                                    <option value="solidary_group">Grupo solidario</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Frecuencia de pago</label>
                                <select value={data.payment_frequency} onChange={e => setData('payment_frequency', e.target.value)} className="w-full rounded border px-3 py-2 text-sm">
                                    <option value="weekly">Semanal</option>
                                    <option value="biweekly">Quincenal</option>
                                    <option value="monthly">Mensual</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Tasa anual (%)</label>
                                <input type="number" step="0.01" value={data.annual_rate} onChange={e => setData('annual_rate', e.target.value)}
                                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Método de cálculo</label>
                                <select value={data.rate_calculation} onChange={e => setData('rate_calculation', e.target.value)} className="w-full rounded border px-3 py-2 text-sm">
                                    <option value="declining">Saldo decreciente (francés)</option>
                                    <option value="flat">Add-on (interés flat)</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Monto mínimo (L.)</label>
                                <input type="number" step="0.01" value={data.min_amount} onChange={e => setData('min_amount', e.target.value)}
                                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Monto máximo (L.)</label>
                                <input type="number" step="0.01" value={data.max_amount} onChange={e => setData('max_amount', e.target.value)}
                                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Cuotas mínimas</label>
                                <input type="number" value={data.min_term_payments} onChange={e => setData('min_term_payments', e.target.value)}
                                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Cuotas máximas</label>
                                <input type="number" value={data.max_term_payments} onChange={e => setData('max_term_payments', e.target.value)}
                                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Comisión apertura</label>
                                <div className="flex gap-2">
                                    <select value={data.origination_fee_type} onChange={e => setData('origination_fee_type', e.target.value)} className="rounded border px-2 py-2 text-sm">
                                        <option value="pct">%</option>
                                        <option value="flat">L. fijo</option>
                                    </select>
                                    <input type="number" step="0.01" value={data.origination_fee_value} onChange={e => setData('origination_fee_value', e.target.value)}
                                        className="flex-1 rounded border px-3 py-2 text-sm focus:outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Seguro (%/cuota)</label>
                                <input type="number" step="0.01" value={data.insurance_pct} onChange={e => setData('insurance_pct', e.target.value)}
                                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Mora</label>
                                <div className="flex gap-2">
                                    <select value={data.late_fee_type} onChange={e => setData('late_fee_type', e.target.value)} className="rounded border px-2 py-2 text-sm">
                                        <option value="daily_pct">% diario</option>
                                        <option value="fixed_daily">L. fijo/día</option>
                                    </select>
                                    <input type="number" step="0.0001" value={data.late_fee_value} onChange={e => setData('late_fee_value', e.target.value)}
                                        className="flex-1 rounded border px-3 py-2 text-sm focus:outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Cycle limits */}
                        <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-xs font-medium text-gray-600">Límites por ciclo (opcional)</label>
                                <button type="button" onClick={addCycleLimit} className="rounded border px-2 py-0.5 text-xs hover:bg-gray-50">+ Agregar ciclo</button>
                            </div>
                            {cycleLimits.map((l, i) => (
                                <div key={i} className="mb-1.5 flex items-center gap-2">
                                    <span className="text-xs text-gray-400 w-12">Ciclo {l.cycle}</span>
                                    <input type="number" step="0.01" value={l.max_amount} onChange={e => updateCycleLimit(i, 'max_amount', e.target.value)}
                                        placeholder="Monto máx." className="flex-1 rounded border px-2 py-1 text-sm focus:outline-none" />
                                    <button type="button" onClick={() => removeCycleLimit(i)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex gap-2">
                            <button onClick={() => setShowModal(false)} className="flex-1 rounded-xl border py-2.5 text-sm hover:bg-gray-50">Cancelar</button>
                            <button onClick={submit} disabled={processing}
                                className="flex-1 rounded-xl bg-black py-2.5 text-sm font-medium text-white disabled:opacity-50">
                                {editing ? 'Guardar cambios' : 'Crear producto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

ConfigProducts.layout = { breadcrumbs };
