import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface BarberDetail {
    id: number; name: string; email: string | null; phone: string | null;
    bio: string | null; color: string; commission_rate: number;
    accepts_walk_ins: boolean; active: boolean;
    schedules: { day_of_week: number; is_working: boolean; start_time: string | null; end_time: string | null; break_start: string | null; break_end: string | null }[];
    time_blocks: { id: number; block_date: string; full_day: boolean; start_time: string | null; end_time: string | null; reason: string | null }[];
}

interface RecentApt {
    id: number; reference: string; appointment_date: string; start_time: string;
    status: string; total: number;
    client: { id: number; name: string } | null;
    services: { service_name: string }[];
}

interface Props { barber: BarberDetail; recentAppointments: RecentApt[]; monthStats: { revenue: number; appointments: number }; }

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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

function fmtDate(d: string) {
    return new Date(d + (d.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BarberShow({ barber, recentAppointments, monthStats }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [blockDate, setBlockDate] = useState('');
    const [blockReason, setBlockReason] = useState('');
    const [blockFullDay, setBlockFullDay] = useState(true);
    const [blockStart, setBlockStart] = useState('');
    const [blockEnd, setBlockEnd] = useState('');
    const [addingBlock, setAddingBlock] = useState(false);
    const [deletingBlockId, setDeletingBlockId] = useState<number | null>(null);

    function addBlock() {
        setAddingBlock(true);
        router.post(`/barbershop/barbers/${barber.id}/time-blocks`, {
            block_date: blockDate,
            full_day: blockFullDay,
            start_time: blockFullDay ? null : blockStart,
            end_time: blockFullDay ? null : blockEnd,
            reason: blockReason,
        }, {
            onFinish: () => { setAddingBlock(false); setBlockDate(''); setBlockReason(''); setBlockStart(''); setBlockEnd(''); },
        });
    }

    function deleteBlock(id: number) {
        setDeletingBlockId(id);
        router.delete(`/barbershop/barbers/${barber.id}/time-blocks/${id}`, { onFinish: () => setDeletingBlockId(null) });
    }

    return (
        <>
            <Head title={`Barbero: ${barber.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/barbershop/barbers">
                            <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1"><ArrowLeft className="h-4 w-4" />Barberos</Button>
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <h1 className="text-lg font-semibold">{barber.name}</h1>
                        <Badge variant={barber.active ? 'secondary' : 'outline'}>{barber.active ? 'Activo' : 'Inactivo'}</Badge>
                    </div>
                    <Link href={`/barbershop/barbers/${barber.id}/edit`}>
                        <Button variant="outline" size="sm" className="gap-1.5"><Pencil className="h-4 w-4" />Editar</Button>
                    </Link>
                </div>

                {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">{flash.success}</div>}
                {flash?.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{flash.error}</div>}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left panel */}
                    <div className="flex flex-col gap-6">
                        {/* Profile card */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: barber.color }}>
                                        {barber.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">{barber.name}</p>
                                        {barber.email && (
                                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                                                <Mail className="h-3 w-3" />{barber.email}
                                            </div>
                                        )}
                                        {barber.phone && (
                                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                                <Phone className="h-3 w-3" />{barber.phone}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 flex-wrap justify-center">
                                        <Badge variant="outline" className="text-xs">Comisión: {barber.commission_rate}%</Badge>
                                        {barber.accepts_walk_ins && <Badge variant="outline" className="text-xs">Walk-in</Badge>}
                                    </div>
                                    {barber.bio && <p className="text-xs text-muted-foreground text-center">{barber.bio}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Month stats */}
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Este Mes</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Ingresos</span>
                                    <span className="font-bold text-green-600">{fmtCurrency(monthStats.revenue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Citas completadas</span>
                                    <span className="font-bold">{monthStats.appointments}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Schedule */}
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Horario</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {DAYS.map((day, i) => {
                                        const sch = barber.schedules.find(s => s.day_of_week === i);
                                        return (
                                            <div key={i} className="flex items-center justify-between text-sm">
                                                <span className={`font-medium w-8 ${sch?.is_working ? '' : 'text-muted-foreground'}`}>{day}</span>
                                                {sch?.is_working ? (
                                                    <span className="text-xs">{sch.start_time?.slice(0, 5)} – {sch.end_time?.slice(0, 5)}</span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Libre</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right panel */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Recent appointments */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4" />Citas Recientes</CardTitle>
                                    <Link href={`/barbershop/appointments?barber_id=${barber.id}`}>
                                        <Button variant="ghost" size="sm" className="text-xs">Ver todas</Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {recentAppointments.length === 0 ? (
                                    <p className="py-6 text-center text-sm text-muted-foreground">Sin citas registradas.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {recentAppointments.map(apt => {
                                            const s = STATUS_MAP[apt.status] ?? { label: apt.status, variant: 'outline' as const };
                                            return (
                                                <Link key={apt.id} href={`/barbershop/appointments/${apt.id}`}>
                                                    <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/40 transition-colors cursor-pointer">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-sm">{apt.client?.name ?? 'Sin cliente'}</span>
                                                                <Badge variant={s.variant} className="text-[10px]">{s.label}</Badge>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{apt.services.map(sv => sv.service_name).join(', ')}</p>
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

                        {/* Time blocks */}
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Bloqueos de Tiempo</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {/* Add block form */}
                                <div className="rounded-lg border p-3 space-y-3 bg-muted/20">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Agregar bloqueo</p>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="flex flex-col gap-1">
                                            <Label className="text-xs">Fecha</Label>
                                            <Input type="date" className="h-8 text-sm" value={blockDate} onChange={e => setBlockDate(e.target.value)} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Label className="text-xs">Motivo</Label>
                                            <Input className="h-8 text-sm" placeholder="Vacaciones, cita médica…" value={blockReason} onChange={e => setBlockReason(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="full_day" checked={blockFullDay} onChange={e => setBlockFullDay(e.target.checked)} className="h-4 w-4 rounded" />
                                            <Label htmlFor="full_day" className="text-xs cursor-pointer">Día completo</Label>
                                        </div>
                                        {!blockFullDay && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <Input type="time" className="h-7 w-24 text-xs" value={blockStart} onChange={e => setBlockStart(e.target.value)} />
                                                <span>—</span>
                                                <Input type="time" className="h-7 w-24 text-xs" value={blockEnd} onChange={e => setBlockEnd(e.target.value)} />
                                            </div>
                                        )}
                                    </div>
                                    <Button size="sm" className="h-8 gap-1.5 text-xs" disabled={!blockDate || addingBlock} onClick={addBlock}>
                                        {addingBlock ? <Spinner className="h-3 w-3" /> : <Plus className="h-3.5 w-3.5" />}
                                        Agregar bloqueo
                                    </Button>
                                </div>

                                {/* Existing blocks */}
                                {barber.time_blocks.length === 0 ? (
                                    <p className="text-center text-sm text-muted-foreground py-4">Sin bloqueos próximos.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {barber.time_blocks.map(block => (
                                            <div key={block.id} className="flex items-center justify-between rounded-lg border p-3">
                                                <div>
                                                    <p className="text-sm font-medium">{fmtDate(block.block_date)}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {block.full_day ? 'Día completo' : `${block.start_time?.slice(0, 5)} – ${block.end_time?.slice(0, 5)}`}
                                                        {block.reason && ` · ${block.reason}`}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                    disabled={deletingBlockId === block.id}
                                                    onClick={() => deleteBlock(block.id)}
                                                >
                                                    {deletingBlockId === block.id ? <Spinner className="h-3 w-3" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                </Button>
                                            </div>
                                        ))}
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

BarberShow.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Barbería', href: '/barbershop' },
        { title: 'Barberos', href: '/barbershop/barbers' },
        { title: 'Perfil', href: '#' },
    ],
};
