import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type ReservationStatus = 'draft' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

interface ReservationRow {
    id: number;
    partner_name: string;
    room_number: string;
    type_name: string;
    check_in_date: string;
    check_out_date: string;
    nights: number;
    status: ReservationStatus;
    total_amount: string | null;
    payment_status: string | null;
}

interface PaginatedReservations {
    data: ReservationRow[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number;
    to: number;
    total: number;
}

interface Props {
    reservations: PaginatedReservations;
    filters: { status?: string; search?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Hospitality', href: '/hospitality/rooms' },
    { title: 'Reservations', href: '/hospitality/reservations' },
];

const STATUS_BADGE: Record<ReservationStatus, string> = {
    draft:       'bg-muted text-muted-foreground',
    confirmed:   'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    checked_in:  'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    checked_out: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    cancelled:   'bg-red-500/20 text-red-600 dark:text-red-400',
};

const STATUS_LABELS: Record<ReservationStatus, string> = {
    draft:       'Borrador',
    confirmed:   'Confirmada',
    checked_in:  'Ingresada',
    checked_out: 'Salida',
    cancelled:   'Cancelada',
};

export default function ReservationsIndex({ reservations, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const [search, setSearch] = useState(filters.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters.status ?? '');
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounce.current) clearTimeout(debounce.current);
        debounce.current = setTimeout(() => {
            router.get('/hospitality/reservations', { search, status: statusFilter }, {
                preserveState: true,
                replace: true,
            });
        }, 300);
    }, [search, statusFilter]);

    const STATUS_OPTIONS: { value: string; label: string }[] = [
        { value: '', label: 'Todas' },
        { value: 'draft', label: 'Borrador' },
        { value: 'confirmed', label: 'Confirmada' },
        { value: 'checked_in', label: 'Ingresada' },
        { value: 'checked_out', label: 'Salida' },
        { value: 'cancelled', label: 'Cancelada' },
    ];

    return (
        <>
            <Head title="Reservations" />
        <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {props.flash?.success && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                        {props.flash.success}
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input type="text" placeholder="Buscar por cliente o folio..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground focus:ring-1 focus:ring-primary focus:outline-none w-52 pl-9" />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {STATUS_OPTIONS.map((s) => (
                            <button key={s.value} onClick={() => setStatusFilter(statusFilter === s.value ? null : s.value)}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${statusFilter === s.value ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
                                {s.label}
                            </button>
                        ))}
                    </div>

                    <Link href="/hospitality/reservations/create">
                        <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 shadow-sm shadow-primary/20">
                            + Nueva Reservación
                        </Button>
                    </Link>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">#</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Huésped</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Habitación</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Entrada</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Salida</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Noches</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Estado</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {reservations.data.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-muted-foreground">No se encontraron reservaciones.</td>
                                </tr>
                            )}
                            {reservations.data.map((r) => (
                                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">#{r.id}</td>
                                    <td className="px-4 py-3 font-medium text-foreground">{r.partner_name}</td>
                                    <td className="px-4 py-3 text-foreground/90">
                                        <span className="font-semibold">{r.room_number}</span>
                                        <span className="text-muted-foreground ml-1 text-xs">{r.type_name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">{r.check_in_date}</td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">{r.check_out_date}</td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">{r.nights}n</td>
                                    <td className="px-4 py-3 text-foreground font-medium">
                                        {r.total_amount ? `L.${r.total_amount}` : <span className="text-muted-foreground/40">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[r.status]}`}>
                                            {STATUS_LABELS[r.status]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link href={`/hospitality/reservations/${r.id}`} className="text-xs text-primary hover:underline">
                                            Ver →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {reservations.links.length > 3 && (
                    <div className="flex justify-center gap-1">
                        {reservations.links.map((link, i) => (
                            <button key={i} disabled={!link.url} onClick={() => router.visit(link.url!)}
                                className={`rounded px-3 py-1.5 text-xs font-semibold transition-all ${link.active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-default'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

ReservationsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
