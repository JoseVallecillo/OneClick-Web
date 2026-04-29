import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CalendarDays, Package, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Alquileres', href: '/rentals' },
];

const STATUS_LABELS: Record<string, string> = {
    draft:     'Borrador',
    confirmed: 'Confirmado',
    active:    'Activo',
    returned:  'Devuelto',
    invoiced:  'Facturado',
    closed:    'Cerrado',
};

const STATUS_COLORS: Record<string, string> = {
    draft:     'bg-secondary text-secondary-foreground',
    confirmed: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    active:    'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    returned:  'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    invoiced:  'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    closed:    'bg-muted text-muted-foreground',
};

const TAB_STATUSES: Record<string, string[]> = {
    all:      [],
    active:   ['confirmed', 'active'],
    returned: ['returned', 'invoiced'],
    closed:   ['closed'],
};

interface Order {
    id: number;
    reference: string;
    status: string;
    start_date: string;
    end_date: string;
    total: string;
    lines_count: number;
    customer: { id: number; name: string };
    creator: { id: number; name: string };
}

interface Props {
    orders: { data: Order[]; links: any[]; meta: any };
    customers: { id: number; name: string }[];
    filters: Record<string, string>;
}

const fmt = (n: string | number) =>
    Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function RentalsIndex({ orders, customers, filters }: Props) {
    const [search, setSearch]     = useState(filters.search ?? '');
    const [customerId, setCustomerId] = useState(filters.customer_id ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]     = useState(filters.date_to ?? '');

    const activeTab = filters.status
        ? Object.entries(TAB_STATUSES).find(([, statuses]) => statuses.includes(filters.status))?.[0] ?? 'all'
        : 'all';

    const navigate = useCallback((overrides: Record<string, string>) => {
        router.get('/rentals', {
            search,
            customer_id: customerId,
            date_from:   dateFrom,
            date_to:     dateTo,
            ...filters,
            ...overrides,
        }, { preserveState: true, replace: true });
    }, [search, customerId, dateFrom, dateTo, filters]);

    const handleTabChange = (tab: string) => {
        const statuses = TAB_STATUSES[tab];
        navigate({ status: statuses.length ? statuses[0] : '' });
    };

    const handleSearch = () => navigate({ search, customer_id: customerId, date_from: dateFrom, date_to: dateTo });

    const tabs = [
        { key: 'all',      label: 'Todos' },
        { key: 'active',   label: 'En Curso' },
        { key: 'returned', label: 'Devueltos' },
        { key: 'closed',   label: 'Cerrados' },
    ];

    return (
        <>
            <Head title="Alquileres" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Alquileres</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.visit('/rentals/calendar')}>
                            <CalendarDays className="mr-1 h-4 w-4" />
                            Calendario
                        </Button>
                        <Button size="sm" onClick={() => router.visit('/rentals/create')}>
                            <Plus className="mr-1 h-4 w-4" />
                            Nueva Reserva
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-border">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => handleTabChange(t.key)}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === t.key ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <Input
                        placeholder="Referencia o cliente..."
                        className="w-56"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Select value={customerId || '_all'} onValueChange={(v) => { setCustomerId(v === '_all' ? '' : v); }}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="Cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Todos los clientes</SelectItem>
                            {customers.map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input type="date" className="w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="Desde" />
                    <Input type="date" className="w-40" value={dateTo}   onChange={(e) => setDateTo(e.target.value)}   placeholder="Hasta" />
                    <Button variant="outline" size="sm" onClick={handleSearch}>Filtrar</Button>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Referencia</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Período</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Items</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                        <Package className="mx-auto mb-2 h-8 w-8" />
                                        No hay reservas que coincidan con los filtros.
                                    </td>
                                </tr>
                            ) : (
                                orders.data.map((order) => (
                                <tr
                                        key={order.id}
                                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                                        onClick={() => router.visit(`/rentals/${order.id}`)}
                                    >
                                        <td className="px-4 py-3 font-mono font-medium text-foreground">{order.reference}</td>
                                        <td className="px-4 py-3 text-foreground/90">{order.customer.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {new Date(order.start_date).toLocaleDateString('es-HN')}
                                            {' → '}
                                            {new Date(order.end_date).toLocaleDateString('es-HN')}
                                        </td>
                                        <td className="px-4 py-3 text-center text-muted-foreground">{order.lines_count}</td>
                                        <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(order.total)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                                                {STATUS_LABELS[order.status]}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {orders.links && (
                    <div className="flex justify-center gap-1">
                        {orders.links.map((link: any, i: number) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-accent text-muted-foreground'} disabled:opacity-40 transition-colors pointer-events-auto cursor-pointer`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

RentalsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
