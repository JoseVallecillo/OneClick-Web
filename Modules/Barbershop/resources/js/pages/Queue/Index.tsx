import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, router, usePage } from '@inertiajs/react';
import { Bell, Check, Phone, Plus, Scissors, Trash2, Users, X } from 'lucide-react';
import { useState } from 'react';

interface BarberOption { id: number; name: string; color: string; }
interface QueueEntry {
    id: number; position: number; client_name: string; client_phone: string | null;
    status: string; notes: string | null; arrived_at: string | null;
    barber: BarberOption | null;
}
interface Props { queue: QueueEntry[]; barbers: BarberOption[]; date: string; }

const STATUS_CONFIG: Record<string, { label: string; className: string; badge: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    waiting:    { label: 'Esperando',   className: 'text-amber-600',  badge: 'outline'     },
    called:     { label: 'Llamado',     className: 'text-blue-600',   badge: 'secondary'   },
    in_service: { label: 'En servicio', className: 'text-green-600',  badge: 'default'     },
    done:       { label: 'Listo',       className: 'text-gray-400',   badge: 'outline'     },
    skipped:    { label: 'Saltado',     className: 'text-red-500',    badge: 'destructive' },
};

export default function QueueIndex({ queue, barbers, date }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [barberId, setBarberId] = useState('');
    const [notes, setNotes] = useState('');
    const [adding, setAdding] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const activeQueue = queue.filter(e => ['waiting', 'called', 'in_service'].includes(e.status));
    const doneQueue   = queue.filter(e => ['done', 'skipped'].includes(e.status));

    function addToQueue() {
        if (!clientName.trim()) return;
        setAdding(true);
        router.post('/barbershop/queue', {
            client_name: clientName,
            client_phone: clientPhone || null,
            barber_id: barberId || null,
            notes: notes || null,
        }, {
            onFinish: () => {
                setAdding(false);
                setClientName('');
                setClientPhone('');
                setBarberId('');
                setNotes('');
            },
        });
    }

    function updateStatus(id: number, status: string) {
        setUpdatingId(id);
        router.post(`/barbershop/queue/${id}/status`, { status }, { onFinish: () => setUpdatingId(null) });
    }

    function remove(id: number) {
        if (!confirm('¿Remover este turno de la cola?')) return;
        setDeletingId(id);
        router.delete(`/barbershop/queue/${id}`, { onFinish: () => setDeletingId(null) });
    }

    const today = new Date(date + 'T12:00:00').toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <>
            <Head title="Cola de Espera" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Cola de Espera
                        </h1>
                        <p className="text-sm text-muted-foreground capitalize">{today}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                            {activeQueue.length} esperando
                        </Badge>
                    </div>
                </div>

                {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">{flash.success}</div>}
                {flash?.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{flash.error}</div>}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Add to queue */}
                    <Card className="lg:col-span-1">
                        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" />Agregar a la Cola</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="client_name">Nombre *</Label>
                                <Input id="client_name" placeholder="Nombre del cliente" value={clientName} onChange={e => setClientName(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="client_phone">Teléfono</Label>
                                <Input id="client_phone" placeholder="Número de teléfono" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Barbero preferido</Label>
                                <Select value={barberId || '__none__'} onValueChange={v => setBarberId(v === '__none__' ? '' : v)}>
                                    <SelectTrigger><SelectValue placeholder="Sin preferencia" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Sin preferencia</SelectItem>
                                        {barbers.map(b => (
                                            <SelectItem key={b.id} value={String(b.id)}>
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: b.color }} />
                                                    {b.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="notes">Notas</Label>
                                <Input id="notes" placeholder="Observaciones…" value={notes} onChange={e => setNotes(e.target.value)} />
                            </div>
                            <Button className="w-full gap-2" disabled={!clientName.trim() || adding} onClick={addToQueue}>
                                {adding ? <Spinner className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                Agregar turno
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Active queue */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Scissors className="h-4 w-4" />
                                    Cola Activa
                                    {activeQueue.length > 0 && (
                                        <Badge variant="secondary" className="ml-1">{activeQueue.length}</Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {activeQueue.length === 0 ? (
                                    <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                                        <Users className="h-8 w-8 opacity-30" />
                                        <p className="text-sm">La cola está vacía. Agrega el primer cliente.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {activeQueue.map((entry, idx) => {
                                            const sc = STATUS_CONFIG[entry.status];
                                            return (
                                                <div key={entry.id} className={`flex items-center gap-3 rounded-xl border p-4 transition-colors ${entry.status === 'in_service' ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30' : entry.status === 'called' ? 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30' : ''}`}>
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted font-bold text-sm flex-shrink-0">
                                                        {entry.position}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-semibold">{entry.client_name}</span>
                                                            <Badge variant={sc.badge} className="text-[10px]">{sc.label}</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                            {entry.client_phone && (
                                                                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{entry.client_phone}</span>
                                                            )}
                                                            {entry.barber && (
                                                                <span className="flex items-center gap-1">
                                                                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.barber.color }} />
                                                                    {entry.barber.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {entry.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{entry.notes}</p>}
                                                    </div>
                                                    <div className="flex gap-1.5 flex-shrink-0">
                                                        {entry.status === 'waiting' && (
                                                            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs text-blue-600 border-blue-300 hover:bg-blue-50" disabled={updatingId === entry.id} onClick={() => updateStatus(entry.id, 'called')}>
                                                                {updatingId === entry.id ? <Spinner className="h-3 w-3" /> : <Bell className="h-3.5 w-3.5" />}
                                                                Llamar
                                                            </Button>
                                                        )}
                                                        {entry.status === 'called' && (
                                                            <Button size="sm" className="h-8 gap-1 text-xs" disabled={updatingId === entry.id} onClick={() => updateStatus(entry.id, 'in_service')}>
                                                                {updatingId === entry.id ? <Spinner className="h-3 w-3" /> : <Scissors className="h-3.5 w-3.5" />}
                                                                Iniciar
                                                            </Button>
                                                        )}
                                                        {entry.status === 'in_service' && (
                                                            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs text-green-600 border-green-300 hover:bg-green-50" disabled={updatingId === entry.id} onClick={() => updateStatus(entry.id, 'done')}>
                                                                {updatingId === entry.id ? <Spinner className="h-3 w-3" /> : <Check className="h-3.5 w-3.5" />}
                                                                Listo
                                                            </Button>
                                                        )}
                                                        {entry.status === 'waiting' && (
                                                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground" disabled={updatingId === entry.id} onClick={() => updateStatus(entry.id, 'skipped')}>
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" disabled={deletingId === entry.id} onClick={() => remove(entry.id)}>
                                                            {deletingId === entry.id ? <Spinner className="h-3 w-3" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Done/skipped */}
                        {doneQueue.length > 0 && (
                            <Card className="opacity-70">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base text-muted-foreground">Completados / Saltados</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-2">
                                        {doneQueue.map(entry => {
                                            const sc = STATUS_CONFIG[entry.status];
                                            return (
                                                <div key={entry.id} className="flex items-center gap-3 rounded-lg border p-3">
                                                    <span className="w-6 text-center text-xs font-bold text-muted-foreground">{entry.position}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm line-through text-muted-foreground">{entry.client_name}</span>
                                                    </div>
                                                    <Badge variant={sc.badge} className="text-[10px]">{sc.label}</Badge>
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" disabled={deletingId === entry.id} onClick={() => remove(entry.id)}>
                                                        {deletingId === entry.id ? <Spinner className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

QueueIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Barbería', href: '/barbershop' },
        { title: 'Cola de Espera', href: '/barbershop/queue' },
    ],
};
