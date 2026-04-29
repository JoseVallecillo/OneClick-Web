import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye, MonitorCheck, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type SessionStatus = 'open' | 'closed';

interface SessionRow {
    id: number;
    reference: string;
    name: string | null;
    status: SessionStatus;
    warehouse: { id: number; name: string };
    currency: { id: number; code: string; symbol: string };
    opening_balance: string;
    total_sales: string;
    sales_count: number;
    opened_at: string | null;
    closed_at: string | null;
    sales_count_from_count: number;
}

interface PaginatedSessions {
    data: SessionRow[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; from: number | null; to: number | null; total: number; per_page: number };
}

interface Props {
    sessions: PaginatedSessions;
    filters: { status?: string; date_from?: string; date_to?: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<SessionStatus, { label: string; className: string }> = {
    open:   { label: 'Abierta', className: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
    closed: { label: 'Cerrada', className: 'border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400' },
};

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function fmtNum(v: string | number) {
    return Number(v).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SessionsIndex({ sessions, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [statusFilter, setStatusFilter] = useState(filters.status ?? '__all__');
    const [dateFrom, setDateFrom]         = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]             = useState(filters.date_to ?? '');

    function navigate(s: string, df: string, dt: string) {
        const p: Record<string, string> = {};
        if (s && s !== '__all__') p.status = s;
        if (df) p.date_from = df;
        if (dt) p.date_to   = dt;
        router.get('/pos/sessions', p, { preserveState: true, replace: true });
    }

    const { data } = sessions;
    const meta = sessions.meta ?? { current_page: 1, last_page: 1, from: null, to: null, total: data.length, per_page: 30 };

    return (
        <>
            <Head title="Punto de Venta — Sesiones" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Status filter */}
                                <div className="flex rounded-md border overflow-hidden text-sm">
                                    {[
                                        { value: '__all__', label: 'Todas' },
                                        { value: 'open',    label: 'Abiertas' },
                                        { value: 'closed',  label: 'Cerradas' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { setStatusFilter(opt.value); navigate(opt.value, dateFrom, dateTo); }}
                                            className={`px-3 py-1.5 transition-colors ${statusFilter === opt.value ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Date range */}
                                <div className="relative">
                                    <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); navigate(statusFilter, e.target.value, dateTo); }}
                                        className="h-9 w-32 text-xs" />
                                    <span className="absolute -top-3 left-1 text-[9px] text-muted-foreground uppercase font-bold bg-background px-1">Desde</span>
                                </div>
                                <div className="relative">
                                    <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); navigate(statusFilter, dateFrom, e.target.value); }}
                                        className="h-9 w-32 text-xs" />
                                    <span className="absolute -top-3 left-1 text-[9px] text-muted-foreground uppercase font-bold bg-background px-1">Hasta</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 ml-auto">
                                {meta.total > 0 && (
                                    <span className="hidden text-xs text-muted-foreground sm:inline-block">
                                        {meta.total} {meta.total === 1 ? 'sesión' : 'sesiones'}
                                    </span>
                                )}
                                <Link href="/pos/sessions/open">
                                    <Button size="sm" className="flex items-center gap-1.5 h-9">
                                        <Plus className="h-4 w-4" />
                                        Abrir Caja
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <MonitorCheck className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No hay sesiones de caja con esos filtros.</p>
                                <Link href="/pos/sessions/open">
                                    <Button size="sm" variant="outline">Abrir primera caja</Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="pb-2 pr-3 font-medium">Referencia</th>
                                                <th className="pb-2 pr-3 font-medium">Nombre</th>
                                                <th className="pb-2 pr-3 font-medium">Estado</th>
                                                <th className="pb-2 pr-3 font-medium">Almacén</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Saldo inicial</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Total ventas</th>
                                                <th className="pb-2 pr-3 font-medium text-center">Ventas</th>
                                                <th className="pb-2 pr-3 font-medium">Apertura</th>
                                                <th className="pb-2 pr-3 font-medium">Cierre</th>
                                                <th className="pb-2 font-medium">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((s) => {
                                                const statusInfo = STATUS_MAP[s.status];
                                                return (
                                                    <tr key={s.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                                                        <td className="py-2 pr-3 font-mono text-xs font-semibold">{s.reference}</td>
                                                        <td className="py-2 pr-3 text-xs">{s.name ?? <span className="text-muted-foreground">—</span>}</td>
                                                        <td className="py-2 pr-3">
                                                            <Badge className={`text-[10px] border ${statusInfo.className}`}>{statusInfo.label}</Badge>
                                                        </td>
                                                        <td className="py-2 pr-3 text-xs">{s.warehouse.name}</td>
                                                        <td className="py-2 pr-3 text-right text-xs tabular-nums">
                                                            {s.currency.symbol} {fmtNum(s.opening_balance)}
                                                        </td>
                                                        <td className="py-2 pr-3 text-right text-xs tabular-nums font-medium">
                                                            {s.currency.symbol} {fmtNum(s.total_sales)}
                                                        </td>
                                                        <td className="py-2 pr-3 text-center text-xs tabular-nums">{s.sales_count}</td>
                                                        <td className="py-2 pr-3 text-xs text-muted-foreground">{fmtDate(s.opened_at)}</td>
                                                        <td className="py-2 pr-3 text-xs text-muted-foreground">{fmtDate(s.closed_at)}</td>
                                                        <td className="py-2">
                                                            <div className="flex items-center gap-1">
                                                                {s.status === 'open' && (
                                                                    <Link href={`/pos/sessions/${s.id}/sell`}>
                                                                        <Button size="sm" className="h-7 gap-1 text-xs px-2">
                                                                            <ShoppingCart className="h-3 w-3" />
                                                                            Vender
                                                                        </Button>
                                                                    </Link>
                                                                )}
                                                                <Link href={`/pos/sessions/${s.id}`}>
                                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                        <Eye className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {meta.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
                                        <span className="text-xs text-muted-foreground">{meta.from}–{meta.to} de {meta.total}</span>
                                        <div className="flex items-center gap-1">
                                            {sessions.links.map((link, i) => {
                                                if (link.label === '&laquo; Previous') return (
                                                    <Button key={i} variant="outline" size="sm" className="h-7 w-7 p-0" disabled={!link.url}
                                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>
                                                        <ChevronLeft className="h-3.5 w-3.5" />
                                                    </Button>
                                                );
                                                if (link.label === 'Next &raquo;') return (
                                                    <Button key={i} variant="outline" size="sm" className="h-7 w-7 p-0" disabled={!link.url}
                                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                );
                                                return (
                                                    <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm"
                                                        className="h-7 min-w-[28px] px-2 text-xs" disabled={!link.url || link.active}
                                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SessionsIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Punto de Venta', href: '/pos/sessions' },
    ],
};
