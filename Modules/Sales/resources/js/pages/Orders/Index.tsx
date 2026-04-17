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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye, FileText, ListFilter, Plus, Receipt, Search, ShoppingBag, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type OrderStatus = 'quote' | 'confirmed' | 'shipped' | 'invoiced';

interface OrderRow {
    id: number;
    reference: string;
    status: OrderStatus;
    customer: { id: number; name: string };
    warehouse: { id: number; name: string };
    currency: { id: number; code: string; symbol: string };
    customer_po_ref: string | null;
    payment_terms: string | null;
    total: string;
    delivery_date: string | null;
    created_at: string;
    lines_count: number;
}

interface CustomerFilter {
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
    customers: CustomerFilter[];
    filters: { status?: string; customer_id?: string; date_from?: string; date_to?: string; search?: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<OrderStatus, { label: string; className: string }> = {
    quote:     { label: 'Cotización',  className: 'border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400' },
    confirmed: { label: 'Confirmada',  className: 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    shipped:   { label: 'Despachada',  className: 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    invoiced:  { label: 'Facturada',   className: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
};

const STATUS_FILTER_OPTIONS = [
    { value: '__all__',   label: 'Todas'       },
    { value: 'quote',     label: 'Cotización'  },
    { value: 'confirmed', label: 'Confirmada'  },
    { value: 'shipped',   label: 'Despachada'  },
    { value: 'invoiced',  label: 'Facturada'   },
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

export default function OrdersIndex({ orders, customers, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [statusFilter, setStatusFilter] = useState(filters.status ?? '__all__');
    const [customerId, setCustomerId]     = useState(filters.customer_id ?? '__all__');
    const [dateFrom, setDateFrom]         = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]             = useState(filters.date_to ?? '');
    const [search, setSearch]             = useState(filters.search ?? '');

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            navigate(statusFilter, customerId, dateFrom, dateTo, search);
        }, 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function navigate(s: string, cust: string, df: string, dt: string, searchVal: string = '') {
        const p: Record<string, string> = {};
        if (s && s !== '__all__')    p.status      = s;
        if (cust && cust !== '__all__') p.customer_id = cust;
        if (df) p.date_from = df;
        if (dt) p.date_to   = dt;
        if (searchVal) p.search = searchVal;
        
        // Preserve current tab if possible
        router.get('/sales/orders', p, { preserveState: true, replace: true });
    }

    const currentTab = ['quote', 'confirmed', 'invoiced'].includes(statusFilter) ? statusFilter : 'quote';

    function handleTabChange(value: string) {
        changeStatus(value);
    }

    function changeStatus(s: string) { setStatusFilter(s); navigate(s, customerId, dateFrom, dateTo, search); }
    function changeCustomer(c: string) { setCustomerId(c); navigate(statusFilter, c, dateFrom, dateTo, search); }
    function changeDateFrom(df: string) { setDateFrom(df); navigate(statusFilter, customerId, df, dateTo, search); }
    function changeDateTo(dt: string) { setDateTo(dt); navigate(statusFilter, customerId, dateFrom, dt, search); }

    const { data } = orders;
    const meta = orders.meta ?? {
        current_page: 1, last_page: 1, from: null, per_page: 50, to: null, total: data.length,
    };

    const activeFilterCount = (statusFilter !== '__all__' ? 1 : 0) + (customerId !== '__all__' ? 1 : 0);

    return (
        <>
            <Head title="Ventas" />

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

                <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
                    <div className="flex items-center justify-between mb-2">
                        <TabsList className="grid grid-cols-3 w-[450px]">
                            <TabsTrigger value="quote" className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5" />
                                Cotizaciones
                            </TabsTrigger>
                            <TabsTrigger value="confirmed" className="flex items-center gap-2">
                                <ShoppingBag className="h-3.5 w-3.5" />
                                Pedidos
                            </TabsTrigger>
                            <TabsTrigger value="invoiced" className="flex items-center gap-2">
                                <Receipt className="h-3.5 w-3.5" />
                                Facturas
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex w-full max-w-2xl flex-wrap items-center gap-2">
                                    {/* Search */}
                                    <div className="relative flex-1 min-w-[200px]">
                                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar referencia o cliente…"
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

                                    {/* Filters dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-9 gap-1.5 focus-visible:ring-0">
                                                <ListFilter className="h-4 w-4" />
                                                <span>Filtrar Clientes</span>
                                                {customerId !== '__all__' && (
                                                    <Badge variant="secondary" className="ml-0.5 h-4.5 rounded-full px-1.5 text-[10px] font-medium">
                                                        1
                                                    </Badge>
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-64">
                                            <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Cliente
                                            </DropdownMenuLabel>
                                            <DropdownMenuRadioGroup value={customerId} onValueChange={changeCustomer}>
                                                <DropdownMenuRadioItem value="__all__" className="text-sm">
                                                    Todos los clientes
                                                </DropdownMenuRadioItem>
                                                {customers.map((c) => (
                                                    <DropdownMenuRadioItem key={c.id} value={String(c.id)} className="text-sm">
                                                        {c.name}
                                                    </DropdownMenuRadioItem>
                                                ))}
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    {/* Date range */}
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <Input type="date" value={dateFrom} onChange={(e) => changeDateFrom(e.target.value)}
                                                className="h-9 w-32 text-xs pl-2 pr-2" />
                                            <span className="absolute -top-3 left-1 text-[9px] text-muted-foreground uppercase font-bold bg-background px-1">Desde</span>
                                        </div>
                                        <div className="relative">
                                            <Input type="date" value={dateTo} onChange={(e) => changeDateTo(e.target.value)}
                                                className="h-9 w-32 text-xs pl-2 pr-2" />
                                            <span className="absolute -top-3 left-1 text-[9px] text-muted-foreground uppercase font-bold bg-background px-1">Hasta</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 ml-auto">
                                    <Link href="/sales/orders/create">
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="flex items-center gap-1.5 h-9 bg-white text-black border-zinc-200 shadow-sm transition-all hover:bg-zinc-100 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Nueva Cotización
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                            {data.length === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                    <ShoppingBag className="h-8 w-8 opacity-40" />
                                    <p className="text-sm">No hay registros en esta categoría.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                                    <th className="pb-2 pr-3 font-semibold">Referencia</th>
                                                    <th className="pb-2 pr-3 font-semibold">Cliente</th>
                                                    <th className="pb-2 pr-3 font-semibold">Almacén</th>
                                                    <th className="pb-2 pr-3 font-semibold text-center">Items</th>
                                                    <th className="pb-2 pr-3 font-semibold text-right">Monto Total</th>
                                                    <th className="pb-2 pr-3 font-semibold">Fecha</th>
                                                    <th className="pb-2 font-semibold">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.map((o) => (
                                                    <tr key={o.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                                                        <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-primary">{o.reference}</td>
                                                        <td className="py-2.5 pr-3">
                                                            <div className="text-[13px] font-medium">{o.customer.name}</div>
                                                            {o.customer_po_ref && <div className="text-[10px] text-muted-foreground font-mono">OC: {o.customer_po_ref}</div>}
                                                        </td>
                                                        <td className="py-2.5 pr-3 text-xs">{o.warehouse.name}</td>
                                                        <td className="py-2.5 pr-3 text-center text-xs tabular-nums">{o.lines_count}</td>
                                                        <td className="py-2.5 pr-3 text-right text-xs tabular-nums font-bold">
                                                            {o.currency.symbol} {fmtNum(o.total)}
                                                        </td>
                                                        <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                                                            {fmtDate(statusFilter === 'quote' ? o.created_at : o.delivery_date)}
                                                        </td>
                                                        <td className="py-2.5">
                                                            <Link href={`/sales/orders/${o.id}`}>
                                                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-primary/20 hover:border-primary/50 text-primary">
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                    Detalle
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
                                            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
                                                Mostrando {meta.from}–{meta.to} de {meta.total} registros
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {orders.links.map((link, i) => {
                                                    if (link.label === '&laquo; Previous') {
                                                        return (
                                                            <Button key={i} variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!link.url}
                                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>
                                                                <ChevronLeft className="h-4 w-4" />
                                                            </Button>
                                                        );
                                                    }
                                                    if (link.label === 'Next &raquo;') {
                                                        return (
                                                            <Button key={i} variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!link.url}
                                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>
                                                                <ChevronRight className="h-4 w-4" />
                                                            </Button>
                                                        );
                                                    }
                                                    return (
                                                        <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm"
                                                            className="h-8 min-w-[32px] px-2 text-xs" disabled={!link.url || link.active}
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
                </Tabs>
            </div>
        </>
    );
}

OrdersIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Ventas', href: '/sales/orders' },
    ],
};
