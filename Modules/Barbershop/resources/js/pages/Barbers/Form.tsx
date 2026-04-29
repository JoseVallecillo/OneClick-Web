import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface BarberDetail {
    id: number; name: string; email: string | null; phone: string | null;
    bio: string | null; color: string; commission_rate: number;
    accepts_walk_ins: boolean; active: boolean;
}

interface ScheduleRow { day_of_week: number; is_working: boolean; start_time: string | null; end_time: string | null; break_start: string | null; break_end: string | null; }
interface Props { barber: BarberDetail | null; schedules: ScheduleRow[]; }

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const defaultSchedules: ScheduleRow[] = DAYS.map((_, i) => ({
    day_of_week: i,
    is_working: i >= 1 && i <= 6,
    start_time: '09:00',
    end_time: '18:00',
    break_start: '12:00',
    break_end: '13:00',
}));

export default function BarberForm({ barber, schedules }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const isEdit = barber !== null;

    const mergedSchedules = DAYS.map((_, i) => {
        const existing = schedules.find(s => s.day_of_week === i);
        return existing ?? defaultSchedules[i];
    });

    const { data, setData, post, patch, processing, errors } = useForm({
        name:             barber?.name ?? '',
        email:            barber?.email ?? '',
        phone:            barber?.phone ?? '',
        bio:              barber?.bio ?? '',
        color:            barber?.color ?? '#3b82f6',
        commission_rate:  barber?.commission_rate ?? 0,
        accepts_walk_ins: barber?.accepts_walk_ins ?? true,
        active:           barber?.active ?? true,
        schedules:        mergedSchedules,
    });

    function updateSchedule(i: number, field: keyof ScheduleRow, value: boolean | string | null) {
        const newSchedules = [...data.schedules];
        newSchedules[i] = { ...newSchedules[i], [field]: value };
        setData('schedules', newSchedules);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) patch(`/barbershop/barbers/${barber.id}`);
        else post('/barbershop/barbers');
    }

    return (
        <>
            <Head title={isEdit ? `Editar: ${barber.name}` : 'Nuevo Barbero'} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <Link href="/barbershop/barbers">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1"><ArrowLeft className="h-4 w-4" />Barberos</Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">{isEdit ? barber.name : 'Nuevo Barbero'}</h1>
                </div>

                {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">{flash.success}</div>}
                {flash?.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{flash.error}</div>}

                <form onSubmit={submit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Datos del Barbero</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label htmlFor="name">Nombre completo *</Label>
                                <Input id="name" placeholder="Nombre del barbero" value={data.name} onChange={e => setData('name', e.target.value)} required />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input id="email" type="email" placeholder="correo@ejemplo.com" value={data.email} onChange={e => setData('email', e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input id="phone" placeholder="Número de teléfono" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="commission_rate">Comisión (%)</Label>
                                <Input id="commission_rate" type="number" step="0.01" min="0" max="100" placeholder="0" value={data.commission_rate} onChange={e => setData('commission_rate', parseFloat(e.target.value) || 0)} />
                                {errors.commission_rate && <p className="text-xs text-destructive">{errors.commission_rate}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="color">Color de identificación</Label>
                                <div className="flex gap-2 items-center">
                                    <input type="color" id="color" value={data.color} onChange={e => setData('color', e.target.value)} className="h-9 w-12 rounded-md border cursor-pointer p-0.5" />
                                    <span className="text-sm text-muted-foreground">{data.color}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label htmlFor="bio">Biografía / especialidades</Label>
                                <textarea
                                    id="bio"
                                    className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                                    placeholder="Especialidades, años de experiencia, técnicas…"
                                    value={data.bio}
                                    onChange={e => setData('bio', e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="accepts_walk_ins" checked={data.accepts_walk_ins} onCheckedChange={v => setData('accepts_walk_ins', v === true)} />
                                <Label htmlFor="accepts_walk_ins" className="cursor-pointer">Acepta walk-ins (sin cita)</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox id="active" checked={data.active} onCheckedChange={v => setData('active', v === true)} />
                                <Label htmlFor="active" className="cursor-pointer">Barbero activo</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Schedule */}
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Horario de trabajo</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {data.schedules.map((sch, i) => (
                                    <div key={i} className="grid gap-2 sm:grid-cols-[120px_1fr] items-center">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`day_${i}`}
                                                checked={sch.is_working}
                                                onCheckedChange={v => updateSchedule(i, 'is_working', v === true)}
                                            />
                                            <Label htmlFor={`day_${i}`} className="cursor-pointer text-sm font-medium">{DAYS[i]}</Label>
                                        </div>
                                        {sch.is_working ? (
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <span>De</span>
                                                    <Input type="time" className="h-7 w-28 text-xs" value={sch.start_time ?? ''} onChange={e => updateSchedule(i, 'start_time', e.target.value)} />
                                                    <span>a</span>
                                                    <Input type="time" className="h-7 w-28 text-xs" value={sch.end_time ?? ''} onChange={e => updateSchedule(i, 'end_time', e.target.value)} />
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <span>Descanso:</span>
                                                    <Input type="time" className="h-7 w-28 text-xs" value={sch.break_start ?? ''} onChange={e => updateSchedule(i, 'break_start', e.target.value || null)} />
                                                    <span>—</span>
                                                    <Input type="time" className="h-7 w-28 text-xs" value={sch.break_end ?? ''} onChange={e => updateSchedule(i, 'break_end', e.target.value || null)} />
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">No labora</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Link href="/barbershop/barbers"><Button type="button" variant="outline">Cancelar</Button></Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? <><Spinner className="mr-1" />Guardando…</> : isEdit ? 'Actualizar Barbero' : 'Crear Barbero'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

BarberForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Barbería', href: '/barbershop' },
        { title: 'Barberos', href: '/barbershop/barbers' },
        { title: 'Detalle', href: '#' },
    ],
};
