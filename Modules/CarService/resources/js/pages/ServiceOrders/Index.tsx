import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Car, ChevronLeft, ChevronRight, Eye, History, ListFilter, PlayCircle, Plus, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type OrderStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

interface OrderRow {
    id: number;
    reference: string;
    status: OrderStatus;
    vehicle: { id: number; plate: string; make: string; model: string; year: number | null };
    customer: { id: number; name: string };
    service_package: { id: number; name: string } | null;
    oil_type: string | null;
    odometer_in: number;
    odometer_out: number | null;
    next_service_km: number | null;
    total: string;
    checked_in_at: string | null;
    completed_at: string | null;
    lines_count: number;
}

interface PaginatedOrders {
    data: OrderRow[];
    links: { url: string | null; label: string; active: boolean }[];
    meta?: {
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
        per_page: number;
    };
    current_page?: number;
    last_page?: number;
    from?: number | null;
    to?: number | null;
    total?: number;
    per_page?: number;
}

interface Props {
    orders: PaginatedOrders;
    filters: { status?: string; date_from?: string; date_to?: string; search?: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<OrderStatus, { label: string; className: string }> = {
    draft:       { label: 'Check-in',   className: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300' },
    in_progress: { label: 'En Proceso', className: 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    completed:   { label: 'Realizado',   className: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
    cancelled:   { label: 'Cancelado',  className: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

const OIL_LABELS: Record<string, string> = {
    mineral:       'Mineral',
    semi_synthetic: 'Semi-Sint.',
    synthetic:     'Sintético',
};

function StatusBadge({ status }: { status: OrderStatus }) {
    const info = STATUS_MAP[status] ?? { label: status, className: '' };
    return <Badge className={`text-[10px] border ${info.className}`}>{info.label}</Badge>;
}

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function fmtTime(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function fmtNum(v: string | number) {
    return Number(v).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ServiceOrdersIndex({ orders, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [statusFilter, setStatusFilter] = useState<string | string[]>(filters.status ?? '__active__');
    const [dateFrom, setDateFrom]         = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]             = useState(filters.date_to ?? '');
    const [search, setSearch]             = useState(filters.search ?? '');

    const currentTab = useMemo(() => {
        if (statusFilter === '__active__') return 'active';
        if (Array.isArray(statusFilter) && statusFilter.includes('draft') && statusFilter.includes('in_progress') && statusFilter.length === 2) return 'active';
        return 'history';
    }, [statusFilter]);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            navigate(statusFilter, dateFrom, dateTo, search);
        }, 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search]);

    function navigate(s: string | string[], df: string, dt: string, q: string = '') {
        const p: Record<string, any> = {};
        if (s) {
            if (s === '__active__') p.status = ['draft', 'in_progress'];
            else if (s !== '__all__') p.status = s;
        }
        if (df) p.date_from = df;
        if (dt) p.date_to   = dt;
        if (q)  p.search    = q;
        router.get('/carservice/orders', p, { preserveState: true, replace: true });
    }

    function handleTabChange(value: string) {
        if (value === 'active') {
            setStatusFilter('__active__');
            navigate('__active__', dateFrom, dateTo, search);
        } else {
            setStatusFilter('__all__');
            navigate('__all__', dateFrom, dateTo, search);
        }
    }

    function changeStatus(s: string)  { setStatusFilter(s); navigate(s, dateFrom, dateTo, search); }
    function changeDateFrom(df: string) { setDateFrom(df); navigate(statusFilter, df, dateTo, search); }
    function changeDateTo(dt: string)  { setDateTo(dt); navigate(statusFilter, dateFrom, dt, search); }

    const { data } = orders;
    const meta = orders.meta ?? {
        current_page: orders.current_page ?? 1,
        last_page: orders.last_page ?? 1,
        from: orders.from ?? null,
        per_page: orders.per_page ?? 50,
        to: orders.to ?? null,
        total: orders.total ?? data.length
    };
    const activeFilterCount = statusFilter !== '__all__' ? 1 : 0;

    return (
        <>
            <Head title="Lubricentro — Órdenes y Check-ins" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between gap-4">
                    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-auto">
                        <TabsList className="bg-muted/50 p-1">
                            <TabsTrigger value="active" className="gap-2 px-6">
                                <PlayCircle className="h-4 w-4" />
                                <span className="hidden sm:inline">Servicios en Curso</span>
                                <span className="sm:hidden">Activos</span>
                            </TabsTrigger>
                            <TabsTrigger value="history" className="gap-2 px-6">
                                <History className="h-4 w-4" />
                                <span className="hidden sm:inline">Historial General</span>
                                <span className="sm:hidden">Historial</span>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

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
                            <div className="flex w-full max-w-2xl flex-wrap items-center gap-2">
                                {/* Search */}
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por referencia, placa o cliente…"
                                        className="h-9 pl-9 pr-8 text-sm"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    {search && (
                                        <button
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => setSearch('')}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Filters */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-9 gap-1.5 focus-visible:ring-0">
                                            <ListFilter className="h-4 w-4" />
                                            <span>Filtros</span>
                                            {activeFilterCount > 0 && (
                                                <Badge variant="secondary" className="ml-0.5 h-4.5 rounded-full px-1.5 text-[10px] font-medium">
                                                    {activeFilterCount}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Estado
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={statusFilter} onValueChange={changeStatus}>
                                            {[
                                                { value: '__all__',   label: 'Todos' },
                                                { value: 'draft',       label: 'Borrador' },
                                                { value: 'in_progress', label: 'En Proceso' },
                                                { value: 'completed',   label: 'Completado' },
                                                { value: 'cancelled',   label: 'Cancelado' },
                                            ].map(opt => (
                                                <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-sm">
                                                    {opt.label}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                        <DropdownMenuSeparator />
                                        <div className="flex flex-col gap-2 p-2">
                                            <div className="relative">
                                                <Input type="date" value={dateFrom} onChange={e => changeDateFrom(e.target.value)} className="h-8 text-xs" />
                                                <span className="absolute -top-2.5 left-1 text-[9px] text-muted-foreground uppercase font-bold bg-background px-1">Desde</span>
                                            </div>
                                            <div className="relative">
                                                <Input type="date" value={dateTo} onChange={e => changeDateTo(e.target.value)} className="h-8 text-xs" />
                                                <span className="absolute -top-2.5 left-1 text-[9px] text-muted-foreground uppercase font-bold bg-background px-1">Hasta</span>
                                            </div>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-3 ml-auto">
                                {meta.total > 0 && (
                                    <span className="hidden text-xs text-muted-foreground sm:inline-block">
                                        {meta.total} {meta.total === 1 ? 'orden' : 'órdenes'}
                                    </span>
                                )}

                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <Car className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No hay órdenes de servicio con esos filtros.</p>

                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="pb-2 pr-3 font-medium">Referencia</th>
                                                <th className="pb-2 pr-3 font-medium">Estado</th>
                                                <th className="pb-2 pr-3 font-medium">Vehículo</th>
                                                <th className="pb-2 pr-3 font-medium">Cliente</th>
                                                {currentTab !== 'active' && <th className="pb-2 pr-3 font-medium">Aceite</th>}
                                                <th className="pb-2 pr-3 font-medium text-right">Odómetro</th>
                                                {currentTab !== 'active' && <th className="pb-2 pr-3 font-medium text-right">Prox. Cambio</th>}
                                                {currentTab !== 'active' && <th className="pb-2 pr-3 font-medium text-right">Total</th>}
                                                <th className="pb-2 pr-3 font-medium">Fecha</th>
                                                <th className="pb-2 pr-3 font-medium">Hora</th>
                                                <th className="pb-2 font-medium">Ver</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((o) => (
                                                <tr key={o.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                                                    <td className="py-2 pr-3 font-mono text-xs font-semibold">{o.reference}</td>
                                                    <td className="py-2 pr-3"><StatusBadge status={o.status} /></td>
                                                    <td className="py-2 pr-3">
                                                        <span className="font-mono text-xs font-bold">{o.vehicle.plate}</span>
                                                        <span className="ml-1.5 text-xs text-muted-foreground">
                                                            {o.vehicle.make} {o.vehicle.model}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 pr-3 text-xs">{o.customer.name}</td>
                                                    {currentTab !== 'active' && (
                                                        <td className="py-2 pr-3 text-xs">
                                                            {o.oil_type ? OIL_LABELS[o.oil_type] ?? o.oil_type : '—'}
                                                        </td>
                                                    )}
                                                    <td className="py-2 pr-3 text-right text-xs tabular-nums">
                                                        {o.odometer_in.toLocaleString('es-HN')} km
                                                    </td>
                                                    {currentTab !== 'active' && (
                                                        <td className="py-2 pr-3 text-right text-xs tabular-nums">
                                                            {o.next_service_km ? `${o.next_service_km.toLocaleString('es-HN')} km` : '—'}
                                                        </td>
                                                    )}
                                                    {currentTab !== 'active' && (
                                                        <td className="py-2 pr-3 text-right text-xs tabular-nums font-medium">
                                                            {fmtNum(o.total)}
                                                        </td>
                                                    )}
                                                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                                                        {fmtDate(o.checked_in_at)}
                                                    </td>
                                                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                                                        {fmtTime(o.checked_in_at)}
                                                    </td>
                                                    <td className="py-2">
                                                        <Link href={`/carservice/orders/${o.id}`}>
                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                <Eye className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {meta.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
                                        <span className="text-xs text-muted-foreground">
                                            {meta.from}–{meta.to} de {meta.total}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {orders.links.map((link, i) => {
                                                if (link.label === '&laquo; Previous') {
                                                    return (
                                                        <Button key={i} variant="outline" size="sm" className="h-7 w-7 p-0" disabled={!link.url}
                                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>
                                                            <ChevronLeft className="h-3.5 w-3.5" />
                                                        </Button>
                                                    );
                                                }
                                                if (link.label === 'Next &raquo;') {
                                                    return (
                                                        <Button key={i} variant="outline" size="sm" className="h-7 w-7 p-0" disabled={!link.url}
                                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>
                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                        </Button>
                                                    );
                                                }
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

ServiceOrdersIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Lubricentro', href: '/carservice/orders' },
    ],
};
