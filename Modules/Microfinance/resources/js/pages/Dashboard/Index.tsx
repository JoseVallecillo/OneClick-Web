import { type BreadcrumbItem } from '@/types';
import { Head,  router  } from '@inertiajs/react';
import { AlertTriangle, CreditCard, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Microfinanzas', href: '/microfinance' },
    { title: 'Dashboard', href: '/microfinance' },
];

const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PAR_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444'];
const PAR_GRADIENTS = [
    'from-emerald-500/20 to-emerald-500/5',
    'from-amber-500/20 to-amber-500/5',
    'from-orange-500/20 to-orange-500/5',
    'from-red-500/20 to-red-500/5'
];

interface ParIndicator { label: string; amount: number; rate: number }
interface Props {
    stats: {
        total_clients: number; active_clients: number; total_portfolio: number;
        active_loans: number; delinquent_loans: number; pending_approval: number; open_aml: number;
    };
    par_indicators: ParIndicator[];
}

export default function Dashboard({ stats, par_indicators }: Props) {
    const kpis = [
        { label: 'Clientes activos', value: stats.active_clients, sub: `${stats.total_clients} total`, icon: Users, color: 'text-blue-600', href: '/microfinance/clients' },
        { label: 'Cartera total', value: `L.${fmt(stats.total_portfolio)}`, sub: `${stats.active_loans} créditos`, icon: TrendingUp, color: 'text-green-600', href: '/microfinance/loans' },
        { label: 'En mora', value: stats.delinquent_loans, sub: null, icon: TrendingDown, color: 'text-red-600', href: '/microfinance/reports/par' },
        { label: 'Pend. aprobación', value: stats.pending_approval, sub: null, icon: CreditCard, color: 'text-yellow-600', href: '/microfinance/loans?status=pending' },
        { label: 'Alertas AML', value: stats.open_aml, sub: null, icon: AlertTriangle, color: stats.open_aml > 0 ? 'text-red-600' : 'text-gray-400', href: '/microfinance/reports/aml' },
    ];

    return (
        <>
            <Head title="Microfinanzas" />
            <div className="flex flex-1 flex-col gap-6 p-6 bg-[#f8fafc]">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Microfinanzas</h1>
                        <p className="text-sm text-slate-500">Resumen operativo y estado de cartera en tiempo real.</p>
                    </div>
                    <button onClick={() => router.post('/microfinance/loans/refresh-delinquency')}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-all active:scale-95">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        Actualizar mora
                    </button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {kpis.map((k) => (
                        <div key={k.label} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer"
                            onClick={() => router.visit(k.href)}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{k.label}</p>
                                    <p className={`mt-2 text-2xl font-bold tracking-tight ${k.color.replace('text-', 'text-slate-900 group-hover:text-')}`}>{k.value}</p>
                                </div>
                                <div className={`rounded-xl p-2 bg-slate-50 group-hover:bg-white group-hover:scale-110 transition-transform ${k.color.replace('text-', 'bg-').replace('600', '50')}`}>
                                    <k.icon className={`h-5 w-5 ${k.color}`} />
                                </div>
                            </div>
                            {k.sub && <p className="mt-2 text-xs font-medium text-slate-400">{k.sub}</p>}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* PaR indicators */}
                    <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-lg font-bold text-slate-900">Cartera en Riesgo (PaR)</h2>
                            <button onClick={() => router.visit('/microfinance/reports/par')} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline-offset-4 hover:underline">
                                Ver reporte completo →
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {par_indicators.map((p, i) => (
                                <div key={p.label} className={`flex flex-col items-center p-4 rounded-2xl bg-gradient-to-b ${PAR_GRADIENTS[i]}`}>
                                    <div className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">{p.label}</div>
                                    <div className="relative h-28 w-28 drop-shadow-sm">
                                        <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#fff" strokeWidth="3" className="opacity-50" />
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke={PAR_COLORS[i]}
                                                strokeWidth="3" strokeDasharray={`${Math.min(100, p.rate)} 100`} strokeLinecap="round" 
                                                className="transition-all duration-1000 ease-out" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-xl font-black" style={{ color: PAR_COLORS[i] }}>{p.rate}%</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-sm font-bold text-slate-800">L.{fmt(p.amount)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-6">Acciones Rápidas</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { label: 'Nuevo Cliente', icon: Users, href: '/microfinance/clients/create', color: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 shadow-lg' },
                                { label: 'Nueva Solicitud', icon: CreditCard, href: '/microfinance/loans/create', color: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100 shadow-lg' },
                                { label: 'Ruta de Cobro', icon: TrendingUp, href: '/microfinance/collection/route', color: 'bg-white border-2 border-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50' },
                                { label: 'Arqueo de Caja', icon: CreditCard, href: '/microfinance/treasury/reconciliation', color: 'bg-white border-2 border-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50' },
                            ].map((a) => (
                                <button key={a.label} onClick={() => router.visit(a.href)}
                                    className={`flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold transition-all active:scale-[0.98] ${a.color}`}>
                                    <div className={`rounded-lg p-1.5 ${a.color.includes('white') ? 'bg-slate-100' : 'bg-white/20'}`}>
                                        <a.icon className="h-4 w-4" />
                                    </div>
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = { breadcrumbs };
