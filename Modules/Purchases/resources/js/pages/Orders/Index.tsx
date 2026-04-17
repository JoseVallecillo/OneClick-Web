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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye, ListFilter, Plus, Search, ShoppingCart, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type OrderStatus = 'draft' | 'confirmed' | 'received' | 'invoiced';

interface OrderRow {
    id: number;
    reference: string;
    status: OrderStatus;
    supplier: { id: number; name: string };
    warehouse: { id: number; name: string };
    currency: { id: number; code: string; symbol: string };
    total: string;
    expected_date: string | null;
    created_at: string;
    lines_count: number;
}

interface SupplierFilter {
    id: number;
    name: string;
}

interface PaginatedOrders {
    data: OrderRow[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: {
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
        per_page: number;
    };
}

interface Props {
    orders: PaginatedOrders;
    suppliers: SupplierFilter[];
    filters: { status?: string; supplier_id?: string; date_from?: string; date_to?: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<OrderStatus, { label: string; className: string }> = {
    draft:     { label: 'Borrador',   className: 'border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400' },
    confirmed: { label: 'Confirmada', className: 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    received:  { label: 'Recibida',   className: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
    invoiced:  { label: 'Facturada',  className: 'border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
};

const STATUS_FILTER_OPTIONS = [
    { value: '__all__',   label: 'Todas'     },
    { value: 'draft',     label: 'Borrador'  },
    { value: 'confirmed', label: 'Confirmada'},
    { value: 'received',  label: 'Recibida'  },
    { value: 'invoiced',  label: 'Facturada' },
];

function StatusBadge({ status }: { status: OrderStatus }) {
    const info = STATUS_MAP[status] ?? { label: status, className: '' };
    return (
        <Badge className={`text-[10px] border ${info.className}`}>
            {info.label}
        </Badge>
    );
}

function fmtDate(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function fmtNum(value: string | number) {
    return Number(value).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OrdersIndex({ orders, suppliers, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [statusFilter, setStatusFilter]   = useState(filters.status ?? '__all__');
    const [supplierId, setSupplierId]       = useState(filters.supplier_id ?? '__all__');
    const [dateFrom, setDateFrom]           = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]               = useState(filters.date_to ?? '');
    const [search, setSearch]               = useState(filters.search ?? '');

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            navigate(statusFilter, supplierId, dateFrom, dateTo, search);
        }, 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function navigate(s: string, sup: string, df: string, dt: string, searchVal: string = '') {
        const p: Record<string, string> = {};
        if (s && s !== '__all__')     p.status      = s;
        if (sup && sup !== '__all__') p.supplier_id = sup;
        if (df) p.date_from = df;
        if (dt) p.date_to   = dt;
        if (searchVal) p.search = searchVal;
        router.get('/purchases/orders', p, { preserveState: true, replace: true });
    }

    function changeStatus(s: string) {
        setStatusFilter(s);
        navigate(s, supplierId, dateFrom, dateTo, search);
    }

    function changeSupplier(sup: string) {
        setSupplierId(sup);
        navigate(statusFilter, sup, dateFrom, dateTo, search);
    }

    function changeDateFrom(df: string) {
        setDateFrom(df);
        navigate(statusFilter, supplierId, df, dateTo, search);
    }

    function changeDateTo(dt: string) {
        setDateTo(dt);
        navigate(statusFilter, supplierId, dateFrom, dt, search);
    }

    const { data } = orders;
    const meta = orders.meta ?? {
        current_page: orders.current_page ?? 1,
        last_page: orders.last_page ?? 1,
        from: orders.from ?? null,
        per_page: orders.per_page ?? 50,
        to: orders.to ?? null,
        total: orders.total ?? data.length,
    };

    return (
        <>
            <Head title="Órdenes de Compra" />

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
                            <div className="flex w-full max-w-md items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por referencia o proveedor…"
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

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-9 gap-1.5 focus-visible:ring-0">
                                            <ListFilter className="h-4 w-4" />
                                            <span>Filtros</span>
                                            {(statusFilter !== '__all__' || supplierId !== '__all__') && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-0.5 h-4.5 rounded-full px-1.5 text-[10px] font-medium"
                                                >
                                                    {(statusFilter !== '__all__' ? 1 : 0) + (supplierId !== '__all__' ? 1 : 0)}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64">
                                        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Estado de Orden
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={statusFilter} onValueChange={changeStatus}>
                                            {STATUS_FILTER_OPTIONS.map((opt) => (
                                                <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-sm">
                                                    {opt.label}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Proveedor
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={supplierId} onValueChange={changeSupplier}>
                                            <DropdownMenuRadioItem value="__all__" className="text-sm">
                                                Todos los proveedores
                                            </DropdownMenuRadioItem>
                                            {suppliers.map((s) => (
                                                <DropdownMenuRadioItem key={s.id} value={String(s.id)} className="text-sm">
                                                    {s.name}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="flex items-center gap-2 ml-2">
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => changeDateFrom(e.target.value)}
                                            className="h-9 w-32 text-xs pl-2 pr-2"
                                        />
                                        <span className="absolute -top-3 left-1 text-[9px] text-muted-foreground uppercase font-bold bg-background px-1">Desde</span>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => changeDateTo(e.target.value)}
                                            className="h-9 w-32 text-xs pl-2 pr-2"
                                        />
                                        <span className="absolute -top-3 left-1 text-[9px] text-muted-foreground uppercase font-bold bg-background px-1">Hasta</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 ml-auto">
                                {meta.total > 0 && (
                                    <span className="hidden text-xs text-muted-foreground sm:inline-block">
                                        {meta.total} {meta.total === 1 ? 'orden' : 'órdenes'}
                                    </span>
                                )}
                                <Link href="/purchases/orders/create">
                                    <Button size="sm" className="flex items-center gap-1.5 h-9">
                                        <Plus className="h-4 w-4" />
                                        Nueva Orden
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <ShoppingCart className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No hay órdenes de compra con esos filtros.</p>
                                <Link href="/purchases/orders/create">
                                    <Button size="sm" variant="outline">Crear primera orden</Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="pb-2 pr-3 font-medium">Referencia</th>
                                                <th className="pb-2 pr-3 font-medium">Estado</th>
                                                <th className="pb-2 pr-3 font-medium">Proveedor</th>
                                                <th className="pb-2 pr-3 font-medium">Almacén</th>
                                                <th className="pb-2 pr-3 font-medium text-center">Líneas</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Total</th>
                                                <th className="pb-2 pr-3 font-medium">Fecha esperada</th>
                                                <th className="pb-2 font-medium">Ver</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((o) => (
                                                <tr key={o.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                                                    <td className="py-2 pr-3 font-mono text-xs font-semibold">{o.reference}</td>
                                                    <td className="py-2 pr-3"><StatusBadge status={o.status} /></td>
                                                    <td className="py-2 pr-3 text-xs">{o.supplier.name}</td>
                                                    <td className="py-2 pr-3 text-xs">{o.warehouse.name}</td>
                                                    <td className="py-2 pr-3 text-center text-xs tabular-nums">{o.lines_count}</td>
                                                    <td className="py-2 pr-3 text-right text-xs tabular-nums font-medium">
                                                        {o.currency.symbol} {fmtNum(o.total)}
                                                    </td>
                                                    <td className="py-2 pr-3 text-xs text-muted-foreground">{fmtDate(o.expected_date)}</td>
                                                    <td className="py-2">
                                                        <Link href={`/purchases/orders/${o.id}`}>
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

OrdersIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Compras', href: '/purchases/orders' },
    ],
};
