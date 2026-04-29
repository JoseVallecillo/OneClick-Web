import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Alquileres', href: '/rentals' },
    { title: 'Reportes', href: '/rentals/reports/overview' },
];

const fmt = (n: string | number) =>
    Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtShort = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n.toFixed(0));

interface UtilizationRow {
    product_id: number; product_name: string; product_sku: string;
    times_rented: number; total_days_rented: number;
    total_revenue: string; utilization_pct: number;
}

interface RoiRow {
    product_id: number; product_name: string; product_sku: string;
    product_cost: number; total_revenue: number; roi_pct: number | null;
}

interface CustomerRow {
    customer_id: number; customer_name: string;
    total_rentals: number; total_damage_charges: string;
    total_spent: string; avg_delay_days: number;
}

interface Summary {
    total_orders: number; gross_revenue: string;
    total_damages: string; avg_rental_days: number;
}

interface Props {
    utilization:   UtilizationRow[];
    roi:           RoiRow[];
    customerStats: CustomerRow[];
    summary:       Summary;
    filters:       { from: string; to: string };
}

export default function RentalReports({ utilization, roi, customerStats, summary, filters }: Props) {
    const [from, setFrom] = useState(filters.from);
    const [to,   setTo]   = useState(filters.to);

    const applyFilters = () => router.get('/rentals/reports/overview', { from, to }, { preserveState: true });

    const roiChartData = roi.slice(0, 10).map((r) => ({
        name: r.product_name.length > 14 ? r.product_name.slice(0, 14) + '…' : r.product_name,
        revenue: r.total_revenue,
        roi: r.roi_pct ?? 0,
    }));

    const utilizationChartData = utilization.slice(0, 10).map((u) => ({
        name: u.product_name.length > 14 ? u.product_name.slice(0, 14) + '…' : u.product_name,
        pct: u.utilization_pct,
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-foreground">Reportes de Alquileres</h1>
                    <div className="flex items-center gap-2">
                        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                            className="rounded border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                        <span className="text-muted-foreground">→</span>
                        <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                            className="rounded border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                        <button onClick={applyFilters}
                            className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors">
                            Aplicar
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: 'Reservas Totales',   value: summary.total_orders,                         suffix: '' },
                        { label: 'Ingresos Brutos',    value: fmt(summary.gross_revenue ?? 0),              suffix: '' },
                        { label: 'Cargos por Daños',   value: fmt(summary.total_damages ?? 0),              suffix: '' },
                        { label: 'Días Prom. Alquiler', value: Number(summary.avg_rental_days ?? 0).toFixed(1), suffix: ' días' },
                    ].map((kpi) => (
                        <div key={kpi.label} className="rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                            <p className="mt-1 text-2xl font-bold text-foreground">{kpi.value}{kpi.suffix}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Utilization chart */}
                    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                        <h2 className="mb-4 font-semibold text-foreground">Tasa de Utilización por Equipo (%)</h2>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={utilizationChartData} margin={{ top: 0, right: 0, left: -20, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} angle={-30} textAnchor="end" stroke="hsl(var(--muted-foreground) / 0.2)" />
                                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 100]} stroke="hsl(var(--muted-foreground) / 0.2)" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    formatter={(v: number) => [`${v}%`, 'Utilización']} 
                                />
                                <Bar dataKey="pct" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* ROI chart */}
                    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                        <h2 className="mb-4 font-semibold text-foreground">Ingresos por Equipo (Top 10)</h2>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={roiChartData} margin={{ top: 0, right: 0, left: -10, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} angle={-30} textAnchor="end" stroke="hsl(var(--muted-foreground) / 0.2)" />
                                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={fmtShort} stroke="hsl(var(--muted-foreground) / 0.2)" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    formatter={(v: number) => [fmt(v), 'Ingresos']} 
                                />
                                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Utilization table */}
                    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                        <div className="border-b border-border px-4 py-3 bg-muted/30">
                            <h2 className="font-semibold text-foreground">Utilización Detallada</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="border-b border-border bg-muted/50">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Equipo</th>
                                    <th className="px-4 py-2 text-center font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Alquileres</th>
                                    <th className="px-4 py-2 text-center font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Días</th>
                                    <th className="px-4 py-2 text-center font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Utiliz.</th>
                                    <th className="px-4 py-2 text-right font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Ingresos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {utilization.slice(0, 15).map((row) => (
                                    <tr key={row.product_id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-2">
                                            <div className="font-medium text-xs text-foreground">{row.product_name}</div>
                                            <div className="text-[10px] text-muted-foreground/60">{row.product_sku}</div>
                                        </td>
                                        <td className="px-4 py-2 text-center text-xs text-foreground/80">{row.times_rented}</td>
                                        <td className="px-4 py-2 text-center text-xs text-foreground/80">{row.total_days_rented}</td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 flex-1 rounded-full bg-muted">
                                                    <div className="h-1.5 rounded-full bg-primary" style={{ width: `${row.utilization_pct}%` }} />
                                                </div>
                                                <span className="text-[10px] font-medium text-foreground">{row.utilization_pct}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-right text-xs font-bold text-foreground">{fmt(row.total_revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Customer reliability */}
                    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                        <div className="border-b border-border px-4 py-3 bg-muted/30">
                            <h2 className="font-semibold text-foreground">Historial de Clientes</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="border-b border-border bg-muted/50">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Cliente</th>
                                    <th className="px-4 py-2 text-center font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Reservas</th>
                                    <th className="px-4 py-2 text-right font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Gastado</th>
                                    <th className="px-4 py-2 text-right font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Daños</th>
                                    <th className="px-4 py-2 text-center font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Retraso</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {customerStats.slice(0, 15).map((row) => (
                                    <tr key={row.customer_id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-2 font-medium text-xs text-foreground">{row.customer_name}</td>
                                        <td className="px-4 py-2 text-center text-xs text-foreground/80">{row.total_rentals}</td>
                                        <td className="px-4 py-2 text-right text-xs text-foreground/80">{fmt(row.total_spent)}</td>
                                        <td className={`px-4 py-2 text-right text-xs ${parseFloat(row.total_damage_charges) > 0 ? 'font-bold text-destructive' : 'text-muted-foreground/40'}`}>
                                            {parseFloat(row.total_damage_charges) > 0 ? fmt(row.total_damage_charges) : '—'}
                                        </td>
                                        <td className={`px-4 py-2 text-center text-xs font-medium ${row.avg_delay_days > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                                            {row.avg_delay_days > 0 ? `+${Number(row.avg_delay_days).toFixed(1)}d` : '✓'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ROI table */}
                <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                    <div className="border-b border-border px-4 py-3 bg-muted/30">
                        <h2 className="font-semibold text-foreground">ROI por Activo</h2>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Equipo</th>
                                <th className="px-4 py-2 text-right font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Costo compra</th>
                                <th className="px-4 py-2 text-right font-medium text-muted-foreground uppercase text-[10px] tracking-wider">Ingresos totales</th>
                                <th className="px-4 py-2 text-right font-medium text-muted-foreground uppercase text-[10px] tracking-wider">ROI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {roi.map((row) => (
                                <tr key={row.product_id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-2">
                                        <div className="font-medium text-sm text-foreground">{row.product_name}</div>
                                        <div className="text-xs text-muted-foreground/60">{row.product_sku}</div>
                                    </td>
                                    <td className="px-4 py-2 text-right text-sm text-foreground/80">{fmt(row.product_cost)}</td>
                                    <td className="px-4 py-2 text-right text-sm font-bold text-foreground">{fmt(row.total_revenue)}</td>
                                    <td className={`px-4 py-2 text-right text-sm font-bold ${row.roi_pct === null ? 'text-muted-foreground/40' : row.roi_pct >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-destructive'}`}>
                                        {row.roi_pct !== null ? `${row.roi_pct > 0 ? '+' : ''}${row.roi_pct}%` : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
