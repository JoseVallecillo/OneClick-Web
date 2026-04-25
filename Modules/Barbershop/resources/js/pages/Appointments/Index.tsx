import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Eye,
    Plus,
    Search,
    Scissors,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface BarberOption { id: number; name: string; color: string; }

interface AppointmentRow {
    id: number;
    reference: string;
    client_name: string;
    client_phone: string | null;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: string;
    total: number;
    payment_status: string;
    barber: BarberOption | null;
    services_count: number;
}

interface PaginatedAppointments {
    data: AppointmentRow[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page?: number;
    last_page?: number;
    from?: number | null;
    to?: number | null;
    total?: number;
    meta?: { current_page: number; last_page: number; from: number | null; to: number | null; total: number };
}

interface Props {
    appointments: PaginatedAppointments;
    barbers: BarberOption[];
    filters: { date?: string; status?: string; barber_id?: string; search?: string };
}

const STATUS_OPTIONS = [
    { value: '', label: 'Todos los estados' },
    { value: 'pending',     label: 'Pendiente'    },
    { value: 'confirmed',   label: 'Confirmada'   },
    { value: 'in_progress', label: 'En progreso'  },
    { value: 'completed',   label: 'Completada'   },
    { value: 'cancelled',   label: 'Cancelada'    },
    { value: 'no_show',     label: 'No llegó'     },
];

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    pending:     { label: 'Pendiente',   variant: 'outline'     },
    confirmed:   { label: 'Confirmada',  variant: 'secondary'   },
    in_progress: { label: 'En progreso', variant: 'default'     },
    completed:   { label: 'Completada',  variant: 'secondary'   },
    cancelled:   { label: 'Cancelada',   variant: 'destructive' },
    no_show:     { label: 'No llegó',    variant: 'destructive' },
};

const PAYMENT_BADGE: Record<string, { label: string; className: string }> = {
    pending:  { label: 'Pendiente', className: 'text-amber-600' },
    paid:     { label: 'Pagado',    className: 'text-green-600' },
    partial:  { label: 'Parcial',   className: 'text-blue-600'  },
    refunded: { label: 'Devuelto',  className: 'text-red-500'   },
};

function fmtCurrency(n: number) {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2 }).format(n);
}

function fmtDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AppointmentsIndex({ appointments, barbers, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [search, setSearch]       = useState(filters.search ?? '');
    const [status, setStatus]       = useState(filters.status ?? '');
    const [barberId, setBarberId]   = useState(filters.barber_id ?? '');
    const [date, setDate]           = useState(filters.date ?? '');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => navigate(search, status, barberId, date), 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function navigate(s: string, st: string, b: string, d: string) {
        const p: Record<string, string> = {};
        if (s)  p.search    = s;
        if (st) p.status    = st;
        if (b)  p.barber_id = b;
        if (d)  p.date      = d;
        router.get('/barbershop/appointments', p, { preserveState: true, replace: true });
    }

    function del(apt: AppointmentRow) {
        if (!confirm(`¿Eliminar la cita "${apt.reference}" de ${apt.client_name}? Esta acción no se puede deshacer.`)) return;
        setDeletingId(apt.id);
        router.delete(`/barbershop/appointments/${apt.id}`, { onFinish: () => setDeletingId(null) });
    }

    const { data } = appointments;
    const meta = appointments.meta ?? {
        current_page: appointments.current_page ?? 1,
        last_page: appointments.last_page ?? 1,
        from: appointments.from ?? null,
        to: appointments.to ?? null,
        total: appointments.total ?? data.length,
    };

    return (
        <>
            <Head title="Citas" />
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
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar cliente, referencia…"
                                    className="h-9 pl-9 pr-8 text-sm"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                {search && (
                                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')}>
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Date */}
                            <Input
                                type="date"
                                className="h-9 w-auto text-sm"
                                value={date}
                                onChange={(e) => { setDate(e.target.value); navigate(search, status, barberId, e.target.value); }}
                            />

                            {/* Status */}
                            <Select value={status || '__all__'} onValueChange={(v) => { const s = v === '__all__' ? '' : v; setStatus(s); navigate(search, s, barberId, date); }}>
                                <SelectTrigger className="h-9 w-44 text-sm">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Todos los estados</SelectItem>
                                    {STATUS_OPTIONS.slice(1).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            {/* Barber */}
                            <Select value={barberId || '__all__'} onValueChange={(v) => { const b = v === '__all__' ? '' : v; setBarberId(b); navigate(search, status, b, date); }}>
                                <SelectTrigger className="h-9 w-44 text-sm">
                                    <SelectValue placeholder="Barbero" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Todos los barberos</SelectItem>
                                    {barbers.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            {(date || status || barberId) && (
                                <Button variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setDate(''); setStatus(''); setBarberId(''); navigate(search, '', '', ''); }}>
                                    <X className="mr-1 h-3 w-3" /> Limpiar
                                </Button>
                            )}

                            <div className="ml-auto flex items-center gap-3">
                                {meta.total > 0 && (
                                    <span className="hidden text-xs text-muted-foreground sm:inline">{meta.total} citas</span>
                                )}
                                <Link href="/barbershop/appointments/create">
                                    <Button size="sm" className="h-9 gap-1.5">
                                        <Plus className="h-4 w-4" />
                                        Nueva Cita
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <Scissors className="h-8 w-8 opacity-30" />
                                <p className="text-sm">No se encontraron citas.</p>
                                <Link href="/barbershop/appointments/create">
                                    <Button variant="outline" size="sm">Nueva cita</Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="pb-2 pr-3 font-medium">Referencia</th>
                                                <th className="pb-2 pr-3 font-medium">Cliente</th>
                                                <th className="pb-2 pr-3 font-medium">Fecha</th>
                                                <th className="pb-2 pr-3 font-medium">Hora</th>
                                                <th className="pb-2 pr-3 font-medium">Barbero</th>
                                                <th className="pb-2 pr-3 font-medium">Estado</th>
                                                <th className="pb-2 pr-3 font-medium">Pago</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Total</th>
                                                <th className="pb-2 pr-3 font-medium">Ver</th>
                                                <th className="pb-2 font-medium">Eliminar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((apt) => {
                                                const s = STATUS_BADGE[apt.status] ?? { label: apt.status, variant: 'outline' as const };
                                                const p = PAYMENT_BADGE[apt.payment_status];
                                                return (
                                                    <tr key={apt.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                        <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">{apt.reference}</td>
                                                        <td className="py-2 pr-3">
                                                            <div>
                                                                <Link href={`/barbershop/appointments/${apt.id}`} className="font-medium hover:text-primary hover:underline">
                                                                    {apt.client_name}
                                                                </Link>
                                                                {apt.client_phone && <p className="text-xs text-muted-foreground">{apt.client_phone}</p>}
                                                            </div>
                                                        </td>
                                                        <td className="py-2 pr-3 text-xs">{fmtDate(apt.appointment_date)}</td>
                                                        <td className="py-2 pr-3 text-xs tabular-nums">{apt.start_time.slice(0, 5)} – {apt.end_time.slice(0, 5)}</td>
                                                        <td className="py-2 pr-3">
                                                            {apt.barber ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: apt.barber.color }} />
                                                                    <span className="text-xs">{apt.barber.name}</span>
                                                                </div>
                                                            ) : <span className="text-xs text-muted-foreground">—</span>}
                                                        </td>
                                                        <td className="py-2 pr-3"><Badge variant={s.variant} className="text-[10px]">{s.label}</Badge></td>
                                                        <td className="py-2 pr-3">
                                                            <span className={`text-xs font-medium ${p?.className}`}>{p?.label ?? apt.payment_status}</span>
                                                        </td>
                                                        <td className="py-2 pr-3 text-right text-xs font-semibold tabular-nums">{fmtCurrency(apt.total)}</td>
                                                        <td className="py-2 pr-3">
                                                            <Link href={`/barbershop/appointments/${apt.id}`}>
                                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </Link>
                                                        </td>
                                                        <td className="py-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                                disabled={deletingId === apt.id}
                                                                onClick={() => del(apt)}
                                                            >
                                                                {deletingId === apt.id ? <Spinner className="h-3 w-3" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {(meta.last_page ?? 1) > 1 && (
                                    <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
                                        <span className="text-xs text-muted-foreground">{meta.from}–{meta.to} de {meta.total}</span>
                                        <div className="flex items-center gap-1">
                                            {appointments.links.map((link, i) => {
                                                if (link.label === '&laquo; Previous') return (
                                                    <Button key={i} variant="outline" size="sm" className="h-7 w-7 p-0" disabled={!link.url} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>
                                                        <ChevronLeft className="h-3.5 w-3.5" />
                                                    </Button>
                                                );
                                                if (link.label === 'Next &raquo;') return (
                                                    <Button key={i} variant="outline" size="sm" className="h-7 w-7 p-0" disabled={!link.url} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                );
                                                return (
                                                    <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm" className="h-7 min-w-[28px] px-2 text-xs" disabled={!link.url || link.active} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })} dangerouslySetInnerHTML={{ __html: link.label }} />
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

AppointmentsIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Barbería', href: '/barbershop' },
        { title: 'Citas', href: '/barbershop/appointments' },
    ],
};
