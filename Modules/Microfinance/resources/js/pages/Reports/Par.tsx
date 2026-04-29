import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Microfinanzas', href: '/microfinance' },
    { title: 'Informe PaR', href: '#' },
];
const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n: number, d: number) => d > 0 ? (n / d * 100).toFixed(1) : '0.0';

interface Tier {
    category: string; label: string; loan_count: number; portfolio_at_risk: number;
    provision_rate: number; provision_required: number;
    loans: Array<{ loan_number: string; days_overdue: number; principal_balance: string; client: { first_name: string; last_name: string } }>;
}
interface Props {
    tiers: Tier[];
    totals: { total_portfolio: number; total_par: number; total_provision: number };
    as_of_date: string;
}

const TIER_COLORS: Record<string, { bar: string; badge: string; bg: string; text: string }> = {
    current: { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', bg: 'bg-emerald-50', text: 'text-emerald-900' },
    par1:    { bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700', bg: 'bg-amber-50', text: 'text-amber-900' },
    par30:   { bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700', bg: 'bg-orange-50', text: 'text-orange-900' },
    par60:   { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700', bg: 'bg-red-50', text: 'text-red-900' },
    par90:   { bar: 'bg-rose-800', badge: 'bg-rose-200 text-rose-900', bg: 'bg-rose-50', text: 'text-rose-900' },
};

export default function ReportsPar({ tiers, totals, as_of_date }: Props) {
    return (
        <>
            <Head title="Microfinanzas" />
            <div className="flex flex-1 flex-col gap-6 p-6 bg-[#f8fafc]">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Informe de Cartera en Riesgo (PaR)</h1>
                        <p className="text-sm text-slate-500 mt-1">Análisis de mora y cálculo de estimación para cuentas incobrables.</p>
                    </div>
                    <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm border border-slate-200">
                        Al {new Date(as_of_date + 'T12:00:00').toLocaleDateString('es-HN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="absolute -right-6 -top-6 rounded-full bg-slate-50 p-10">
                            <div className="h-10 w-10"></div>
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cartera total</p>
                        <p className="mt-2 text-3xl font-black text-slate-900 relative">L.{fmt(totals.total_portfolio)}</p>
                    </div>
                    <div className="relative overflow-hidden rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-rose-500">Cartera en riesgo (PaR &gt; 0)</p>
                        <p className="mt-2 text-3xl font-black text-rose-700 relative">L.{fmt(totals.total_par)}</p>
                        <div className="mt-4 flex items-center justify-between border-t border-rose-100 pt-3">
                            <span className="text-xs font-bold text-rose-600">{pct(totals.total_par, totals.total_portfolio)}% del total</span>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Provisión requerida</p>
                        <p className="mt-2 text-3xl font-black text-amber-800 relative">L.{fmt(totals.total_provision)}</p>
                        <div className="mt-4 flex items-center justify-between border-t border-amber-100 pt-3">
                            <span className="text-xs font-bold text-amber-700">{pct(totals.total_provision, totals.total_portfolio)}% del total</span>
                        </div>
                    </div>
                </div>

                {/* Tier breakdown */}
                <div className="space-y-6">
                    {tiers.map(tier => {
                        const colors = TIER_COLORS[tier.category] ?? TIER_COLORS.current;
                        const barWidth = pct(tier.portfolio_at_risk, totals.total_portfolio);
                        return (
                            <div key={tier.category} className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <div className={`border-b border-slate-100 p-6 ${colors.bg}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className={`rounded-xl px-3 py-1 font-black uppercase tracking-wider text-sm ${colors.badge}`}>{tier.label}</span>
                                            <span className="font-bold text-slate-700">{tier.loan_count} {tier.loan_count === 1 ? 'crédito' : 'créditos'}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-2xl font-black ${colors.text}`}>L.{fmt(tier.portfolio_at_risk)}</p>
                                            <p className="mt-1 text-sm font-bold text-slate-500">Provisión ({(tier.provision_rate * 100).toFixed(0)}%): L.{fmt(tier.provision_required)}</p>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex h-2 w-full overflow-hidden rounded-full bg-white/60">
                                        <div className={`h-full ${colors.bar} transition-all duration-1000 ease-out`} style={{ width: `${barWidth}%` }} />
                                    </div>
                                </div>
                                {tier.loans.length > 0 && (
                                    <div className="max-h-72 overflow-y-auto bg-white">
                                        <table className="w-full text-sm">
                                            <thead className="sticky top-0 bg-white border-b border-slate-100 shadow-sm z-10">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Cliente</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">N° Crédito</th>
                                                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Días mora</th>
                                                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Saldo Principal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {tier.loans.map(l => (
                                                    <tr key={l.loan_number} className="hover:bg-slate-50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-slate-800">{l.client.first_name} {l.client.last_name}</td>
                                                        <td className="px-6 py-4 font-mono text-slate-500">{l.loan_number}</td>
                                                        <td className={`px-6 py-4 text-center font-black ${l.days_overdue > 0 ? 'text-rose-600' : 'text-emerald-500'}`}>
                                                            {l.days_overdue > 0 ? `+${l.days_overdue}d` : '✓ Al día'}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-bold text-slate-800">L.{fmt(l.principal_balance)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

ReportsPar.layout = { breadcrumbs };
