import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Pencil, Phone, Scissors, ShoppingBag, User } from 'lucide-react';
import { useState } from 'react';

interface AppointmentDetail {
    id: number;
    reference: string;
    client_id: number | null;
    client_name: string;
    client_phone: string | null;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: string;
    source: string;
    notes: string | null;
    internal_notes: string | null;
    subtotal: number;
    discount: number;
    total: number;
    payment_method: string | null;
    payment_status: string;
    checked_in_at: string | null;
    completed_at: string | null;
    barber: { id: number; name: string; color: string } | null;
    client: {
        id: number;
        name: string;
        phone: string | null;
        mobile: string | null;
        barbershop_profile: { total_visits: number; total_spent: number } | null;
    } | null;
    services: { id: number; service_name: string; duration_minutes: number; price: number }[];
    products: { id: number; product_name: string; quantity: number; unit_price: number; total: number }[];
}

interface Props { appointment: AppointmentDetail; }

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    pending:     { label: 'Pendiente',   variant: 'outline'     },
    confirmed:   { label: 'Confirmada',  variant: 'secondary'   },
    in_progress: { label: 'En progreso', variant: 'default'     },
    completed:   { label: 'Completada',  variant: 'secondary'   },
    cancelled:   { label: 'Cancelada',   variant: 'destructive' },
    no_show:     { label: 'No llegó',    variant: 'destructive' },
};

const PAYMENT_MAP: Record<string, { label: string; className: string }> = {
    pending:  { label: 'Pendiente', className: 'text-amber-600'  },
    paid:     { label: 'Pagado',    className: 'text-green-600'  },
    partial:  { label: 'Parcial',   className: 'text-blue-600'   },
    refunded: { label: 'Devuelto',  className: 'text-red-500'    },
};

const SOURCE_MAP: Record<string, string> = {
    manual:  'Manual',
    walk_in: 'Walk-in',
    online:  'En línea',
};

const METHOD_MAP: Record<string, string> = {
    cash:     'Efectivo',
    card:     'Tarjeta',
    transfer: 'Transferencia',
    other:    'Otro',
};

function fmtCurrency(n: number) {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2 }).format(n);
}

function fmtDate(d: string) {
    return new Date(d + 'T12:00:00').toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function AppointmentShow({ appointment }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [newStatus, setNewStatus] = useState(appointment.status);
    const [paymentMethod, setPaymentMethod] = useState(appointment.payment_method ?? '');
    const [paymentStatus, setPaymentStatus] = useState(appointment.payment_status);
    const [updating, setUpdating] = useState(false);

    const s = STATUS_MAP[appointment.status] ?? { label: appointment.status, variant: 'outline' as const };
    const p = PAYMENT_MAP[appointment.payment_status];

    function updateStatus() {
        setUpdating(true);
        router.post(`/barbershop/appointments/${appointment.id}/status`, {
            status: newStatus,
            payment_method: paymentMethod || null,
            payment_status: paymentStatus,
        }, {
            onFinish: () => setUpdating(false),
        });
    }

    const canChangeStatus = !['cancelled', 'no_show'].includes(appointment.status);

    return (
        <>
            <Head title={`Cita: ${appointment.reference}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/barbershop/appointments">
                            <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                                <ArrowLeft className="h-4 w-4" />
                                Citas
                            </Button>
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <h1 className="text-lg font-semibold">{appointment.reference}</h1>
                        <Badge variant={s.variant}>{s.label}</Badge>
                    </div>
                    {appointment.status !== 'completed' && appointment.status !== 'cancelled' && appointment.status !== 'no_show' && (
                        <Link href={`/barbershop/appointments/${appointment.id}/edit`}>
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <Pencil className="h-4 w-4" />
                                Editar
                            </Button>
                        </Link>
                    )}
                </div>

                {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">{flash.success}</div>}
                {flash?.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{flash.error}</div>}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main info */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Client & Barber */}
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Información General</CardTitle></CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="flex items-start gap-3">
                                    <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Cliente</p>
                                        {appointment.client ? (
                                            <Link href={`/barbershop/clients/${appointment.client.id}`} className="font-medium hover:text-primary hover:underline">
                                                {appointment.client_name}
                                            </Link>
                                        ) : (
                                            <p className="font-medium">{appointment.client_name}</p>
                                        )}
                                        {appointment.client_phone && (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Phone className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground">{appointment.client_phone}</span>
                                            </div>
                                        )}
                                        {appointment.client?.barbershop_profile && (
                                            <p className="text-xs text-muted-foreground mt-1">{appointment.client.barbershop_profile.total_visits} visitas · {fmtCurrency(appointment.client.barbershop_profile.total_spent)} gastados</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="h-4 w-4 mt-0.5 flex-shrink-0 rounded-full" style={{ backgroundColor: appointment.barber?.color ?? '#ccc' }} />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Barbero</p>
                                        {appointment.barber ? (
                                            <Link href={`/barbershop/barbers/${appointment.barber.id}`} className="font-medium hover:text-primary hover:underline">
                                                {appointment.barber.name}
                                            </Link>
                                        ) : <p className="text-muted-foreground text-sm">Sin asignar</p>}
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Fecha</p>
                                        <p className="font-medium text-sm">{fmtDate(appointment.appointment_date)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Horario</p>
                                        <p className="font-medium text-sm">{appointment.start_time.slice(0, 5)} – {appointment.end_time.slice(0, 5)}</p>
                                        <p className="text-xs text-muted-foreground">{SOURCE_MAP[appointment.source] ?? appointment.source}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Services */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Scissors className="h-4 w-4" />
                                    Servicios
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {appointment.services.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">Sin servicios registrados.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {appointment.services.map(svc => (
                                            <div key={svc.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                                                <div>
                                                    <p className="text-sm font-medium">{svc.service_name}</p>
                                                    <p className="text-xs text-muted-foreground">{svc.duration_minutes} min</p>
                                                </div>
                                                <span className="text-sm font-semibold">{fmtCurrency(svc.price)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Products */}
                        {appointment.products.length > 0 && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <ShoppingBag className="h-4 w-4" />
                                        Productos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-2">
                                        {appointment.products.map(prd => (
                                            <div key={prd.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                                                <div>
                                                    <p className="text-sm font-medium">{prd.product_name}</p>
                                                    <p className="text-xs text-muted-foreground">{prd.quantity} × {fmtCurrency(prd.unit_price)}</p>
                                                </div>
                                                <span className="text-sm font-semibold">{fmtCurrency(prd.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Notes */}
                        {(appointment.notes || appointment.internal_notes) && (
                            <Card>
                                <CardHeader className="pb-3"><CardTitle className="text-base">Notas</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    {appointment.notes && (
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">Para el cliente</p>
                                            <p className="text-sm whitespace-pre-wrap">{appointment.notes}</p>
                                        </div>
                                    )}
                                    {appointment.internal_notes && (
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">Internas</p>
                                            <p className="text-sm whitespace-pre-wrap">{appointment.internal_notes}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right sidebar: Totals + Status Update */}
                    <div className="flex flex-col gap-6">
                        {/* Totals */}
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Resumen</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{fmtCurrency(appointment.subtotal)}</span>
                                </div>
                                {appointment.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Descuento</span>
                                        <span className="text-red-500">− {fmtCurrency(appointment.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t pt-3 text-base font-bold">
                                    <span>Total</span>
                                    <span>{fmtCurrency(appointment.total)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Estado pago</span>
                                    <span className={`font-medium ${p?.className}`}>{p?.label ?? appointment.payment_status}</span>
                                </div>
                                {appointment.payment_method && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Método</span>
                                        <span>{METHOD_MAP[appointment.payment_method] ?? appointment.payment_method}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Status Update */}
                        {canChangeStatus && (
                            <Card>
                                <CardHeader className="pb-3"><CardTitle className="text-base">Actualizar Estado</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex flex-col gap-1.5">
                                        <Select value={newStatus} onValueChange={setNewStatus}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">Pendiente</SelectItem>
                                                <SelectItem value="confirmed">Confirmada</SelectItem>
                                                <SelectItem value="in_progress">En progreso</SelectItem>
                                                <SelectItem value="completed">Completada</SelectItem>
                                                <SelectItem value="cancelled">Cancelada</SelectItem>
                                                <SelectItem value="no_show">No llegó</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {newStatus === 'completed' && (
                                        <>
                                            <div className="flex flex-col gap-1.5">
                                                <Select value={paymentMethod || '__none__'} onValueChange={v => setPaymentMethod(v === '__none__' ? '' : v)}>
                                                    <SelectTrigger><SelectValue placeholder="Método de pago" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__none__">Sin especificar</SelectItem>
                                                        <SelectItem value="cash">Efectivo</SelectItem>
                                                        <SelectItem value="card">Tarjeta</SelectItem>
                                                        <SelectItem value="transfer">Transferencia</SelectItem>
                                                        <SelectItem value="other">Otro</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="paid">Pagado</SelectItem>
                                                        <SelectItem value="partial">Parcial</SelectItem>
                                                        <SelectItem value="pending">Pendiente</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    )}

                                    <Button
                                        className="w-full"
                                        onClick={updateStatus}
                                        disabled={updating || newStatus === appointment.status}
                                    >
                                        {updating ? 'Actualizando…' : 'Actualizar Estado'}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

AppointmentShow.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Barbería', href: '/barbershop' },
        { title: 'Citas', href: '/barbershop/appointments' },
        { title: 'Detalle', href: '#' },
    ],
};
