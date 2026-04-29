import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
    Calendar,
    CalendarClock,
    CircleDollarSign,
    Clock,
    TrendingUp,
    Users,
    Scissors,
} from 'lucide-react';

interface AppointmentRow {
    id: number;
    reference: string;
    client_name: string;
    start_time: string;
    end_time: string;
    status: string;
    total: number;
    barber: { id: number; name: string; color: string } | null;
    services: { service_name: string }[];
}

interface QueueEntry {
    id: number;
    position: number;
    client_name: string;
    client_phone: string | null;
    status: string;
    barber: { id: number; name: string; color: string } | null;
}

interface TopBarber {
    id: number;
    name: string;
    color: string;
    completed_count: number;
    month_revenue: number;
}

interface Props {
    todayAppointments: AppointmentRow[];
    stats: {
        today_revenue: number;
        month_revenue: number;
        month_appointments: number;
        pending_today: number;
        queue_count: number;
    };
    queueToday: QueueEntry[];
    topBarbers: TopBarber[];
    weekRevenue: { date: string; label: string; revenue: number }[];
    today: string;
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    pending:     { label: 'Pendiente',   variant: 'outline'     },
    confirmed:   { label: 'Confirmada',  variant: 'secondary'   },
    in_progress: { label: 'En progreso', variant: 'default'     },
    completed:   { label: 'Completada',  variant: 'secondary'   },
    cancelled:   { label: 'Cancelada',   variant: 'destructive' },
    no_show:     { label: 'No llegó',    variant: 'destructive' },
};

const QUEUE_STATUS_MAP: Record<string, { label: string; color: string }> = {
    waiting:    { label: 'Esperando',   color: 'text-amber-600'  },
    called:     { label: 'Llamado',     color: 'text-blue-600'   },
    in_service: { label: 'En servicio', color: 'text-green-600'  },
    done:       { label: 'Listo',       color: 'text-gray-400'   },
    skipped:    { label: 'Saltado',     color: 'text-red-400'    },
};

function fmtCurrency(n: number) {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2 }).format(n);
}

export default function BarbershopDashboard({ todayAppointments, stats, queueToday, topBarbers, weekRevenue, today }: Props) {
    return (
        <>
            <Head title="Barbería — Panel de Control" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Scissors className="h-6 w-6 text-primary" />
                        <h1 className="text-xl font-bold">Barbería</h1>
                        <span className="text-sm text-muted-foreground">{new Date(today + 'T12:00:00').toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/barbershop/queue">
                            <Button variant="outline" size="sm" className="gap-1.5">
                                <Users className="h-4 w-4" />
                                Cola de espera
                                {stats.queue_count > 0 && (
                                    <Badge variant="secondary" className="ml-0.5 h-4.5 rounded-full px-1.5 text-[10px]">
                                        {stats.queue_count}
                                    </Badge>
                                )}
                            </Button>
                        </Link>
                        <Link href="/barbershop/appointments/create">
                            <Button size="sm" className="gap-1.5">
                                <Calendar className="h-4 w-4" />
                                Nueva Cita
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Ingresos Hoy</p>
                                    <p className="mt-1 text-2xl font-bold">{fmtCurrency(stats.today_revenue)}</p>
                                </div>
                                <CircleDollarSign className="h-8 w-8 text-green-500 opacity-70" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
                                    <p className="mt-1 text-2xl font-bold">{fmtCurrency(stats.month_revenue)}</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-blue-500 opacity-70" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Citas este Mes</p>
                                    <p className="mt-1 text-2xl font-bold">{stats.month_appointments}</p>
                                </div>
                                <CalendarClock className="h-8 w-8 text-purple-500 opacity-70" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Pendientes Hoy</p>
                                    <p className="mt-1 text-2xl font-bold">{stats.pending_today}</p>
                                </div>
                                <Clock className="h-8 w-8 text-amber-500 opacity-70" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main content: Appointments + Queue + Chart */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Today's Appointments */}
                    <div className="lg:col-span-2">
                        <Card className="h-full">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Citas de Hoy</CardTitle>
                                    <Link href={`/barbershop/appointments?date=${today}`}>
                                        <Button variant="ghost" size="sm" className="text-xs">Ver todas</Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {todayAppointments.length === 0 ? (
                                    <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                                        <Calendar className="h-8 w-8 opacity-30" />
                                        <p className="text-sm">No hay citas para hoy.</p>
                                        <Link href="/barbershop/appointments/create">
                                            <Button variant="outline" size="sm">Agendar cita</Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {todayAppointments.map((apt) => {
                                            const s = STATUS_MAP[apt.status] ?? { label: apt.status, variant: 'outline' as const };
                                            return (
                                                <Link key={apt.id} href={`/barbershop/appointments/${apt.id}`}>
                                                    <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                                                        <div
                                                            className="h-10 w-1 rounded-full flex-shrink-0"
                                                            style={{ backgroundColor: apt.barber?.color ?? '#6366f1' }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm truncate">{apt.client_name}</span>
                                                                <Badge variant={s.variant} className="text-[10px] shrink-0">{s.label}</Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {apt.services.map(sv => sv.service_name).join(', ') || 'Sin servicios'}
                                                            </p>
                                                        </div>
                                                        <div className="text-right shrink-0">
                                                            <p className="text-xs font-medium">{apt.start_time.slice(0, 5)}</p>
                                                            <p className="text-xs text-muted-foreground">{apt.barber?.name ?? '—'}</p>
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

                    {/* Right column: Queue + Top Barbers */}
                    <div className="flex flex-col gap-6">
                        {/* Queue */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Cola Actual</CardTitle>
                                    <Link href="/barbershop/queue">
                                        <Button variant="ghost" size="sm" className="text-xs">Gestionar</Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {queueToday.filter(e => e.status === 'waiting' || e.status === 'called' || e.status === 'in_service').length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">Cola vacía</p>
                                ) : (
                                    <div className="space-y-2">
                                        {queueToday
                                            .filter(e => ['waiting', 'called', 'in_service'].includes(e.status))
                                            .slice(0, 6)
                                            .map((entry) => {
                                                const st = QUEUE_STATUS_MAP[entry.status];
                                                return (
                                                    <div key={entry.id} className="flex items-center gap-3">
                                                        <span className="w-5 text-center text-xs font-bold text-muted-foreground">
                                                            {entry.position}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{entry.client_name}</p>
                                                            <p className="text-xs text-muted-foreground">{entry.barber?.name ?? 'Sin barbero'}</p>
                                                        </div>
                                                        <span className={`text-xs font-medium ${st?.color}`}>{st?.label}</span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Barbers */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Rendimiento del Mes</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {topBarbers.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">Sin datos este mes</p>
                                ) : (
                                    <div className="space-y-3">
                                        {topBarbers.map((b, i) => (
                                            <div key={b.id} className="flex items-center gap-3">
                                                <span className="w-4 text-center text-xs text-muted-foreground">{i + 1}</span>
                                                <div
                                                    className="h-7 w-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                                                    style={{ backgroundColor: b.color }}
                                                >
                                                    {b.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{b.name}</p>
                                                    <p className="text-xs text-muted-foreground">{b.completed_count} citas</p>
                                                </div>
                                                <span className="text-xs font-semibold text-green-600">{fmtCurrency(b.month_revenue ?? 0)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Weekly Revenue Chart */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Ingresos últimos 7 días</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={weekRevenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                <YAxis
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `L.${(v / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    formatter={(value: number) => [fmtCurrency(value), 'Ingresos']}
                                    labelStyle={{ fontSize: 12 }}
                                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                                />
                                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={48} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

BarbershopDashboard.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Barbería', href: '/barbershop' },
    ],
};
