import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { Camera, MapPin } from 'lucide-react';
import { useState } from 'react';

const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-HN');

const scoreColor = (s: number) => s >= 70 ? 'text-green-600' : s >= 50 ? 'text-yellow-600' : 'text-red-600';
const scoreBar   = (s: number) => s >= 70 ? 'bg-green-500' : s >= 50 ? 'bg-yellow-500' : 'bg-red-500';

const PAR_STATUS: Record<string, string> = {
    current: 'Al día', par1: 'PaR 1d', par30: 'PaR 30d', par60: 'PaR 60d', par90: 'PaR 90d',
};
const PAR_COLOR: Record<string, string> = {
    current: 'bg-green-100 text-green-700', par1: 'bg-yellow-100 text-yellow-700',
    par30: 'bg-orange-100 text-orange-700', par60: 'bg-red-100 text-red-700', par90: 'bg-red-200 text-red-900',
};

interface Loan { id: number; loan_number: string; product: { name: string }; principal_balance: string; days_overdue: number; par_category: string; status: string; cycle_number: number }
interface Snapshot { id: number; captured_by: number; monthly_net_estimated: string; inventory_value: string; observations?: string; created_at: string; photos?: string[] }
interface Reference { id: number; reference_type: string; name: string; phone?: string; relationship?: string; verified: boolean }
interface Client {
    id: number; client_number: string; first_name: string; last_name: string;
    identity_number: string; phone_mobile?: string; phone_whatsapp?: string;
    address?: string; business_name?: string; business_type?: string;
    monthly_revenue: string; monthly_expenses: string; monthly_payment_capacity: string;
    internal_score: number; score_breakdown?: Record<string, number>;
    completed_cycles: number; status: string; latitude?: number; longitude?: number;
    loans: Loan[]; snapshots: Snapshot[]; references: Reference[];
    group_memberships: Array<{ group: { id: number; group_number: string; name: string; status: string; cycle_number: number } }>;
}
interface Props { client: Client }

export default function ClientShow({ client }: Props) {
    const [tab, setTab] = useState<'loans' | 'snapshots' | 'references' | 'groups'>('loans');
    const [showSnap, setShowSnap] = useState(false);

    const snapForm = useForm({ inventory_value: '', daily_sales_estimated: '', monthly_expenses_verified: '', monthly_net_estimated: '', observations: '' });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Microfinanzas', href: '/microfinance' },
        { title: 'Clientes', href: '/microfinance/clients' },
        { title: `${client.first_name} ${client.last_name}`, href: `#` },
    ];

    const activeLoans = client.loans.filter(l => ['disbursed','current','delinquent'].includes(l.status));
    const totalDebt   = activeLoans.reduce((s, l) => s + Number(l.principal_balance), 0);

    const submitSnap = (e: React.FormEvent) => {
        e.preventDefault();
        snapForm.post(`/microfinance/clients/${client.id}/snapshot`, { onSuccess: () => { setShowSnap(false); snapForm.reset(); } });
    };

    const scoreBreakdown = client.score_breakdown ? Object.entries(client.score_breakdown) : [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-xl font-bold text-gray-600">
                            {client.first_name[0]}{client.last_name[0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold">{client.first_name} {client.last_name}</h1>
                                <span className={`rounded-full px-2 py-0.5 text-xs ${client.status === 'active' ? 'bg-green-100 text-green-700' : client.status === 'blacklisted' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {client.status === 'active' ? 'Activo' : client.status === 'blacklisted' ? 'Bloqueado' : 'Prospecto'}
                                </span>
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">
                                {client.client_number} · {client.identity_number}
                                {client.phone_mobile && ` · ${client.phone_mobile}`}
                                {client.phone_whatsapp && ` · WA: ${client.phone_whatsapp}`}
                            </p>
                            {client.business_name && <p className="text-xs text-gray-400 capitalize">{client.business_type} — {client.business_name}</p>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowSnap(true)} className="flex items-center gap-1 rounded border px-3 py-1.5 text-sm hover:bg-gray-50">
                            <Camera className="h-4 w-4" /> Visita campo
                        </button>
                        <button onClick={() => router.visit(`/microfinance/clients/${client.id}/edit`)}
                            className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-900">Editar</button>
                    </div>
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-5 gap-3">
                    <div className="rounded-lg border bg-white p-3">
                        <p className="text-xs text-gray-400">Score interno</p>
                        <p className={`mt-1 text-2xl font-bold ${scoreColor(client.internal_score)}`}>{client.internal_score}<span className="text-sm font-normal">/100</span></p>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                            <div className={`h-1.5 rounded-full ${scoreBar(client.internal_score)}`} style={{ width: `${client.internal_score}%` }} />
                        </div>
                    </div>
                    <div className="rounded-lg border bg-white p-3">
                        <p className="text-xs text-gray-400">Ciclos completados</p>
                        <p className="mt-1 text-2xl font-bold text-blue-600">{client.completed_cycles}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-3">
                        <p className="text-xs text-gray-400">Deuda activa</p>
                        <p className="mt-1 text-xl font-bold text-gray-800">L.{fmt(totalDebt)}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-3">
                        <p className="text-xs text-gray-400">Capacidad de pago</p>
                        <p className="mt-1 text-xl font-bold text-green-600">L.{fmt(client.monthly_payment_capacity)}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-3">
                        <p className="text-xs text-gray-400">Ingreso neto / mes</p>
                        <p className="mt-1 text-xl font-bold">L.{fmt(Number(client.monthly_revenue) - Number(client.monthly_expenses))}</p>
                    </div>
                </div>

                {/* Score breakdown */}
                {scoreBreakdown.length > 0 && (
                    <div className="rounded-lg border bg-white px-4 py-3">
                        <p className="mb-2 text-xs font-semibold text-gray-500">Desglose del score</p>
                        <div className="flex flex-wrap gap-4">
                            {scoreBreakdown.map(([k, v]) => (
                                <div key={k} className="text-center">
                                    <div className="text-xs capitalize text-gray-400">{k}</div>
                                    <div className={`text-sm font-bold ${scoreColor(v as number)}`}>{v as number}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="border-b">
                    {(['loans','snapshots','references','groups'] as const).map(t => {
                        const labels = { loans: 'Créditos', snapshots: 'Visitas campo', references: 'Referencias', groups: 'Grupos' };
                        return (
                            <button key={t} onClick={() => setTab(t)}
                                className={`px-4 py-2 text-sm ${tab === t ? 'border-b-2 border-black font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                                {labels[t]}
                            </button>
                        );
                    })}
                </div>

                {tab === 'loans' && (
                    <div className="overflow-hidden rounded-lg border bg-white">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">N° Crédito</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Producto</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500">Ciclo</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500">Saldo</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500">Mora</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500">PaR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {client.loans.map(l => (
                                    <tr key={l.id} className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => router.visit(`/microfinance/loans/${l.id}`)}>
                                        <td className="px-4 py-3 font-mono text-xs font-medium">{l.loan_number}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{l.product.name}</td>
                                        <td className="px-4 py-3 text-center text-xs">{l.cycle_number}</td>
                                        <td className="px-4 py-3 text-right font-medium">L.{fmt(l.principal_balance)}</td>
                                        <td className={`px-4 py-3 text-center text-xs font-bold ${l.days_overdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {l.days_overdue > 0 ? `+${l.days_overdue}d` : '✓'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`rounded-full px-2 py-0.5 text-xs ${PAR_COLOR[l.par_category]}`}>{PAR_STATUS[l.par_category]}</span>
                                        </td>
                                    </tr>
                                ))}
                                {client.loans.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">Sin créditos</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === 'snapshots' && (
                    <div className="space-y-3">
                        {client.snapshots.map(s => (
                            <div key={s.id} className="rounded-lg border bg-white p-4">
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>{fmtDate(s.created_at)}</span>
                                    <span>Ingreso neto estimado: <strong className="text-gray-700">L.{fmt(s.monthly_net_estimated)}</strong></span>
                                    <span>Inventario: <strong className="text-gray-700">L.{fmt(s.inventory_value)}</strong></span>
                                </div>
                                {s.observations && <p className="mt-2 text-sm text-gray-600">{s.observations}</p>}
                                {s.photos && s.photos.length > 0 && (
                                    <div className="mt-2 flex gap-2">
                                        {s.photos.map((p, i) => <img key={i} src={`/storage/${p}`} className="h-20 w-20 rounded object-cover" alt="" />)}
                                    </div>
                                )}
                            </div>
                        ))}
                        {client.snapshots.length === 0 && <div className="rounded-lg border bg-white py-8 text-center text-gray-400">Sin visitas registradas</div>}
                    </div>
                )}

                {tab === 'references' && (
                    <div className="overflow-hidden rounded-lg border bg-white">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Tipo</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Nombre</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Relación</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Teléfono</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500">Verificado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {client.references.map(r => (
                                    <tr key={r.id}>
                                        <td className="px-4 py-3 text-xs capitalize">{r.reference_type}</td>
                                        <td className="px-4 py-3 font-medium">{r.name}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{r.relationship ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{r.phone ?? '—'}</td>
                                        <td className="px-4 py-3 text-center">{r.verified ? '✓' : '—'}</td>
                                    </tr>
                                ))}
                                {client.references.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">Sin referencias</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}

                {tab === 'groups' && (
                    <div className="overflow-hidden rounded-lg border bg-white">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">N° Grupo</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500">Nombre</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500">Ciclo</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-500">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {client.group_memberships.map(gm => (
                                    <tr key={gm.group.id} className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => router.visit(`/microfinance/groups/${gm.group.id}`)}>
                                        <td className="px-4 py-3 font-mono text-xs">{gm.group.group_number}</td>
                                        <td className="px-4 py-3 font-medium">{gm.group.name}</td>
                                        <td className="px-4 py-3 text-center text-xs">{gm.group.cycle_number}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`rounded-full px-2 py-0.5 text-xs ${gm.group.status === 'blocked' ? 'bg-red-100 text-red-700' : gm.group.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {gm.group.status === 'blocked' ? '🔒 Bloqueado' : gm.group.status === 'active' ? 'Activo' : gm.group.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {client.group_memberships.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-400">No pertenece a grupos</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Field snapshot modal */}
            {showSnap && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <form onSubmit={submitSnap} className="w-96 rounded-xl bg-white p-6 shadow-xl">
                        <h3 className="mb-4 font-semibold">Registro de visita en campo</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                ['Valor inventario (L.)', 'inventory_value'],
                                ['Ventas diarias estim. (L.)', 'daily_sales_estimated'],
                                ['Gastos mensuales verif. (L.)', 'monthly_expenses_verified'],
                                ['Ingreso neto estimado (L.)', 'monthly_net_estimated'],
                            ].map(([label, key]) => (
                                <div key={key}>
                                    <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
                                    <input type="number" step="0.01" value={(snapForm.data as any)[key]}
                                        onChange={e => snapForm.setData(key as any, e.target.value)}
                                        className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                                </div>
                            ))}
                            <div className="col-span-2">
                                <label className="mb-1 block text-xs font-medium text-gray-600">Observaciones</label>
                                <textarea rows={2} value={snapForm.data.observations} onChange={e => snapForm.setData('observations', e.target.value)}
                                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none" />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button type="button" onClick={() => setShowSnap(false)} className="flex-1 rounded border py-2 text-sm hover:bg-gray-50">Cancelar</button>
                            <button type="submit" disabled={snapForm.processing} className="flex-1 rounded bg-black py-2 text-sm text-white hover:bg-gray-900 disabled:opacity-50">Guardar</button>
                        </div>
                    </form>
                </div>
            )}
        </AppLayout>
    );
}
