import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { AlertTriangle, CreditCard, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Microfinanzas', href: '/microfinance' },
    { title: 'Dashboard', href: '/microfinance' },
];

const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PAR_COLORS = ['#22c55e', '#facc15', '#f97316', '#ef4444'];

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
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Dashboard Microfinanzas</h1>
                    <button onClick={() => router.post('/microfinance/loans/refresh-delinquency')}
                        className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">Actualizar mora</button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-5 gap-3">
                    {kpis.map((k) => (
                        <div key={k.label} className="cursor-pointer rounded-lg border bg-white p-3 hover:shadow-sm"
                            onClick={() => router.visit(k.href)}>
                            <div className="flex items-start justify-between">
                                <p className="text-xs text-gray-400">{k.label}</p>
                                <k.icon className={`h-4 w-4 ${k.color}`} />
                            </div>
                            <p className={`mt-1 text-xl font-bold ${k.color}`}>{k.value}</p>
                            {k.sub && <p className="text-xs text-gray-400">{k.sub}</p>}
                        </div>
                    ))}
                </div>

                {/* PaR indicators */}
                <div className="rounded-lg border bg-white p-4">
                    <h2 className="mb-4 text-sm font-semibold text-gray-700">Cartera en Riesgo (PaR)</h2>
                    <div className="grid grid-cols-4 gap-4">
                        {par_indicators.map((p, i) => (
                            <div key={p.label} className="text-center">
                                <div className="mb-2 text-xs text-gray-400">{p.label}</div>
                                <div className="relative mx-auto h-24 w-24">
                                    <svg viewBox="0 0 36 36" className="h-24 w-24 -rotate-90">
                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={PAR_COLORS[i]}
                                            strokeWidth="3" strokeDasharray={`${Math.min(100, p.rate)} 100`} strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`text-lg font-bold`} style={{ color: PAR_COLORS[i] }}>{p.rate}%</span>
                                    </div>
                                </div>
                                <div className="mt-1 text-xs font-medium text-gray-600">L.{fmt(p.amount)}</div>
                            </div>
                        ))}
                    </div>
                    <p className="mt-3 text-right text-xs text-gray-400">
                        <button onClick={() => router.visit('/microfinance/reports/par')} className="text-blue-600 hover:underline">
                            Ver reporte completo →
                        </button>
                    </p>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: '+ Nuevo cliente', href: '/microfinance/clients/create', color: 'bg-black text-white' },
                        { label: '+ Nueva solicitud', href: '/microfinance/loans/create', color: 'bg-blue-600 text-white' },
                        { label: 'Ruta de cobro hoy', href: '/microfinance/collection/route', color: 'border hover:bg-gray-50' },
                        { label: 'Arqueo del día', href: '/microfinance/treasury/reconciliation', color: 'border hover:bg-gray-50' },
                    ].map((a) => (
                        <button key={a.label} onClick={() => router.visit(a.href)}
                            className={`rounded-lg px-4 py-3 text-sm font-medium ${a.color}`}>
                            {a.label}
                        </button>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
