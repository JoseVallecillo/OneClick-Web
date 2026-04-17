import AppLayout from '@/layouts/app-layout';
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

const TIER_COLORS: Record<string, { bar: string; badge: string }> = {
    current: { bar: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
    par1:    { bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
    par30:   { bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
    par60:   { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
    par90:   { bar: 'bg-red-800', badge: 'bg-red-200 text-red-900' },
};

export default function ReportsPar({ tiers, totals, as_of_date }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Informe de Cartera en Riesgo (PaR)</h1>
                    <p className="text-sm text-gray-400">Al {new Date(as_of_date + 'T12:00:00').toLocaleDateString('es-HN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>

                {/* Totals */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border bg-white p-4">
                        <p className="text-xs text-gray-400">Cartera total</p>
                        <p className="mt-1 text-2xl font-bold text-gray-800">L.{fmt(totals.total_portfolio)}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                        <p className="text-xs text-gray-400">Cartera en riesgo (PaR &gt; 0)</p>
                        <p className="mt-1 text-2xl font-bold text-red-600">L.{fmt(totals.total_par)}</p>
                        <p className="text-xs text-gray-400">{pct(totals.total_par, totals.total_portfolio)}% del total</p>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                        <p className="text-xs text-gray-400">Provisión requerida</p>
                        <p className="mt-1 text-2xl font-bold text-orange-600">L.{fmt(totals.total_provision)}</p>
                        <p className="text-xs text-gray-400">{pct(totals.total_provision, totals.total_portfolio)}% del total</p>
                    </div>
                </div>

                {/* Tier breakdown */}
                {tiers.map(tier => {
                    const colors = TIER_COLORS[tier.category] ?? TIER_COLORS.current;
                    const barWidth = pct(tier.portfolio_at_risk, totals.total_portfolio);
                    return (
                        <div key={tier.category} className="rounded-lg border bg-white">
                            <div className="border-b p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`rounded px-2 py-0.5 text-xs font-bold ${colors.badge}`}>{tier.label}</span>
                                        <span className="text-sm text-gray-600">{tier.loan_count} crédito{tier.loan_count !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">L.{fmt(tier.portfolio_at_risk)}</p>
                                        <p className="text-xs text-gray-400">Provisión ({(tier.provision_rate * 100).toFixed(0)}%): L.{fmt(tier.provision_required)}</p>
                                    </div>
                                </div>
                                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
                                    <div className={`h-1.5 rounded-full ${colors.bar} transition-all`} style={{ width: `${barWidth}%` }} />
                                </div>
                            </div>
                            {tier.loans.length > 0 && (
                                <div className="max-h-48 overflow-y-auto">
                                    <table className="w-full text-xs">
                                        <thead className="border-b bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium text-gray-500">Cliente</th>
                                                <th className="px-3 py-2 text-left font-medium text-gray-500">N° Crédito</th>
                                                <th className="px-3 py-2 text-center font-medium text-gray-500">Días mora</th>
                                                <th className="px-3 py-2 text-right font-medium text-gray-500">Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {tier.loans.map(l => (
                                                <tr key={l.loan_number}>
                                                    <td className="px-3 py-1.5">{l.client.first_name} {l.client.last_name}</td>
                                                    <td className="px-3 py-1.5 font-mono">{l.loan_number}</td>
                                                    <td className={`px-3 py-1.5 text-center font-bold ${l.days_overdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                        {l.days_overdue > 0 ? `+${l.days_overdue}d` : '✓'}
                                                    </td>
                                                    <td className="px-3 py-1.5 text-right">L.{fmt(l.principal_balance)}</td>
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
        </AppLayout>
    );
}
