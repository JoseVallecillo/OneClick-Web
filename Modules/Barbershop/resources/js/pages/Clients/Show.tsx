import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Mail, Phone, Scissors, Star, User } from 'lucide-react';

interface BarbershopProfile {
    preferred_barber_id: number | null;
    preferred_style: string | null;
    total_visits: number;
    total_spent: number;
    last_visit_at: string | null;
    preferred_barber: { id: number; name: string } | null;
}

interface ContactDetail {
    id: number;
    name: string;
    phone: string | null;
    mobile: string | null;
    email: string | null;
    notes: string | null;
    active: boolean;
    barbershop_profile: BarbershopProfile | null;
}

interface AppointmentRow {
    id: number;
    reference: string;
    appointment_date: string;
    start_time: string;
    status: string;
    total: number;
    barber: { id: number; name: string; color: string } | null;
    services: { service_name: string }[];
}

interface Props {
    client: ContactDetail;
    appointments: AppointmentRow[];
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    pending:     { label: 'Pendiente',   variant: 'outline'     },
    confirmed:   { label: 'Confirmada',  variant: 'secondary'   },
    in_progress: { label: 'En progreso', variant: 'default'     },
    completed:   { label: 'Completada',  variant: 'secondary'   },
    cancelled:   { label: 'Cancelada',   variant: 'destructive' },
    no_show:     { label: 'No llegó',    variant: 'destructive' },
};

function fmtCurrency(n: number) {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2 }).format(n);
}

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d + (d.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ClientShow({ client, appointments }: Props) {
    const profile = client.barbershop_profile;

    return (
        <>
            <Head title={`Cliente: ${client.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/barbershop/clients">
                            <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1"><ArrowLeft className="h-4 w-4" />Clientes</Button>
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <h1 className="text-lg font-semibold">{client.name}</h1>
                        <Badge variant={client.active ? 'secondary' : 'outline'}>{client.active ? 'Activo' : 'Inactivo'}</Badge>
                    </div>
                    <Link href={`/barbershop/clients/${client.id}/edit`}>
                        <Button variant="outline" size="sm">Editar</Button>
                    </Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Contact info + stats */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold">{client.name}</p>
                                            <p className="text-xs text-muted-foreground">Cliente de barbería</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 border-t pt-3">
                                        {(client.phone || client.mobile) && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{client.phone ?? client.mobile}</span>
                                            </div>
                                        )}
                                        {client.email && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>{client.email}</span>
                                            </div>
                                        )}
                                        {profile?.preferred_barber && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
                                                <span>Barbero: <Link href={`/barbershop/barbers/${profile.preferred_barber.id}`} className="hover:text-primary hover:underline">{profile.preferred_barber.name}</Link></span>
                                            </div>
                                        )}
                                        {profile?.preferred_style && (
                                            <div className="flex items-start gap-2 text-sm">
                                                <Star className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                                                <span>{profile.preferred_style}</span>
                                            </div>
                                        )}
                                        {client.notes && (
                                            <div className="border-t pt-2 text-xs text-muted-foreground whitespace-pre-wrap">{client.notes}</div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Estadísticas</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total de visitas</span>
                                    <span className="text-lg font-bold">{profile?.total_visits ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total gastado</span>
                                    <span className="text-lg font-bold text-green-600">{fmtCurrency(profile?.total_spent ?? 0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Última visita</span>
                                    <span className="text-sm">{fmtDate(profile?.last_visit_at ?? null)}</span>
                                </div>
                                {(profile?.total_visits ?? 0) > 0 && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Ticket promedio</span>
                                        <span className="text-sm font-semibold">{fmtCurrency((profile!.total_spent) / profile!.total_visits)}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Link href={`/barbershop/appointments/create?client_id=${client.id}`} className="block">
                            <Button className="w-full gap-2">
                                <Calendar className="h-4 w-4" />
                                Nueva Cita
                            </Button>
                        </Link>
                    </div>

                    {/* Appointment history */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Historial de Citas
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {appointments.length === 0 ? (
                                    <div className="py-12 text-center text-muted-foreground">
                                        <p className="text-sm">Sin citas registradas.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {appointments.map(apt => {
                                            const s = STATUS_MAP[apt.status] ?? { label: apt.status, variant: 'outline' as const };
                                            return (
                                                <Link key={apt.id} href={`/barbershop/appointments/${apt.id}`}>
                                                    <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                                                        <div className="h-10 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: apt.barber?.color ?? '#6366f1' }} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-xs text-muted-foreground">{apt.reference}</span>
                                                                <Badge variant={s.variant} className="text-[10px]">{s.label}</Badge>
                                                            </div>
                                                            <p className="text-sm font-medium truncate">{apt.services.map(sv => sv.service_name).join(', ') || 'Sin servicios'}</p>
                                                            <p className="text-xs text-muted-foreground">{apt.barber?.name ?? 'Sin barbero'} · {apt.start_time.slice(0, 5)}</p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-sm font-semibold">{fmtCurrency(apt.total)}</p>
                                                            <p className="text-xs text-muted-foreground">{fmtDate(apt.appointment_date)}</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

ClientShow.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Barbería', href: '/barbershop' },
        { title: 'Clientes', href: '/barbershop/clients' },
        { title: 'Perfil', href: '#' },
    ],
};
