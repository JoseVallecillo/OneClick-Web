import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BedDouble, Calendar, CreditCard, Printer, User } from 'lucide-react';

type ReservationStatus = 'draft' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

interface FolioData {
    subtotal: string;
    isv_amount: string;
    tourism_tax_amount: string;
    total_amount: string;
    payment_status: 'pending' | 'partial' | 'paid';
}

interface ReservationDetail {
    id: number;
    status: ReservationStatus;
    partner: { id: number; name: string };
    room: { id: number; room_number: string; floor: number; type_name: string };
    check_in_date: string;
    check_out_date: string;
    nights: number;
    notes: string | null;
    created_by: string;
    created_at: string;
    folio: FolioData | null;
}

interface Props {
    reservation: ReservationDetail;
}

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string }> = {
    draft:       { label: 'Borrador',     color: 'bg-muted text-muted-foreground border-border' },
    confirmed:   { label: 'Confirmada',   color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30' },
    checked_in:  { label: 'Ingresada',    color: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30' },
    checked_out: { label: 'Salida',       color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
    cancelled:   { label: 'Cancelada',    color: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' },
};

const PAYMENT_CONFIG = {
    pending: 'text-amber-600 dark:text-amber-400',
    partial: 'text-blue-600 dark:text-blue-400',
    paid:    'text-emerald-600 dark:text-emerald-400',
};

const fmt = (n: string | number | null) =>
    n ? Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

export default function ReservationShow({ reservation: r }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const status = STATUS_CONFIG[r.status];

    function action(endpoint: string) {
        router.post(`/hospitality/reservations/${r.id}/${endpoint}`);
    }

    return (
        <>
            <Head title={`Reservation #${r.id}`} />
        <div className="flex h-full flex-1 flex-col gap-4 p-4">
            <div className="mx-auto w-full max-w-4xl space-y-6">
                {props.flash?.success && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                        {props.flash.success}
                    </div>
                )}
                {props.flash?.error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {props.flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-foreground">Reservación #{r.id}</h1>
                        <span className={`rounded-full border px-3 py-0.5 text-xs font-medium ${status.color}`}>
                            {status.label}
                        </span>
                    </div>

                    {/* Workflow actions */}
                    <div className="flex gap-2">
                        {r.status === 'draft' && (
                            <>
                                <Link href={`/hospitality/reservations/${r.id}/edit`}>
                                    <Button size="sm" variant="outline" className="text-xs h-8">
                                        Editar
                                    </Button>
                                </Link>
                                <Button size="sm" onClick={() => action('confirm')} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 shadow-sm shadow-primary/20">
                                    Confirmar
                                </Button>
                            </>
                        )}
                        {r.status === 'confirmed' && (
                            <>
                                <Link href={`/hospitality/reservations/${r.id}/edit`}>
                                    <Button size="sm" variant="outline" className="text-xs h-8">
                                        Editar
                                    </Button>
                                </Link>
                                <Button size="sm" onClick={() => action('check-in')} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 shadow-sm shadow-primary/20">
                                    Ingresar
                                </Button>
                            </>
                        )}
                        {r.status === 'checked_in' && (
                            <Button size="sm" onClick={() => action('check-out')} variant="destructive" className="font-semibold text-xs h-8">
                                Registrar Salida
                            </Button>
                        )}
                        {(r.status === 'draft' || r.status === 'confirmed') && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { if (confirm('¿Cancelar esta reservación?')) action('cancel'); }}
                                className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs h-8"
                            >
                                Cancelar
                            </Button>
                        )}
                    </div>
                </div>

                {/* Info grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Guest */}
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Huésped</span>
                        </div>
                        <p className="font-semibold text-foreground">{r.partner.name}</p>
                    </div>

                    {/* Room */}
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <BedDouble className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Habitación</span>
                        </div>
                        <p className="font-semibold text-foreground">Habitación {r.room.room_number}</p>
                        <p className="text-xs text-muted-foreground">{r.room.type_name} · Piso {r.room.floor}</p>
                    </div>

                    {/* Dates */}
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Estadía</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground/60">Entrada</p>
                                <p className="font-semibold text-foreground">{r.check_in_date}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground/60">Noches</p>
                                <p className="font-bold text-primary text-xl">{r.nights}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground/60">Salida</p>
                                <p className="font-semibold text-foreground">{r.check_out_date}</p>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {r.notes && (
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Notas</p>
                            <p className="text-sm text-foreground/80">{r.notes}</p>
                        </div>
                    )}
                </div>

                {/* Folio */}
                {r.folio && (
                    <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Folio</span>
                            </div>
                            <span className={`text-xs font-medium capitalize ${PAYMENT_CONFIG[r.folio.payment_status]}`}>
                                {r.folio.payment_status === 'pending' ? 'Pendiente' : r.folio.payment_status === 'partial' ? 'Parcial' : 'Pagado'}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="text-foreground">L.{r.folio.subtotal}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground/60">ISV (15%)</span>
                                <span className="text-muted-foreground">L.{r.folio.isv_amount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground/60">Impuesto S. Turismo (4%)</span>
                                <span className="text-muted-foreground">L.{r.folio.tourism_tax_amount}</span>
                            </div>
                            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                                <span className="text-foreground">Total</span>
                                <span className="text-primary text-xl">L.{fmt(r.folio.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Meta */}
                <p className="text-xs text-muted-foreground/40 text-right">
                    Creado por {r.created_by} · {r.created_at}
                </p>
            </div>
        </div>
        </>
    );
}

ReservationShow.layout = (page: React.ReactNode) => {
    const reservation = (page as any).props.reservation;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Hospitality', href: '/hospitality/rooms' },
        { title: 'Reservations', href: '/hospitality/reservations' },
        { title: `Reservación #${reservation.id}`, href: `/hospitality/reservations/${reservation.id}` },
    ];
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
