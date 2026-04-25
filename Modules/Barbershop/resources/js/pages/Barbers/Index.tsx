import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, Plus, Scissors, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

interface BarberRow {
    id: number; name: string; email: string | null; phone: string | null;
    color: string; commission_rate: number; accepts_walk_ins: boolean;
    active: boolean; appointments_count: number;
}

interface Props {
    barbers: BarberRow[];
    filters: { active?: string };
}

export default function BarbersIndex({ barbers, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [activeFilter, setActiveFilter] = useState(filters.active ?? '');

    function changeActive(v: string) {
        const a = v === '__all__' ? '' : v;
        setActiveFilter(a);
        const p: Record<string, string> = {};
        if (a) p.active = a;
        router.get('/barbershop/barbers', p, { preserveState: true, replace: true });
    }

    function del(b: BarberRow) {
        if (!confirm(`¿Eliminar al barbero "${b.name}"? Esta acción no se puede deshacer.`)) return;
        setDeletingId(b.id);
        router.delete(`/barbershop/barbers/${b.id}`, { onFinish: () => setDeletingId(null) });
    }

    return (
        <>
            <Head title="Barberos" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">{flash.success}</div>}
                {flash?.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{flash.error}</div>}

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <Select value={activeFilter || '__all__'} onValueChange={changeActive}>
                                <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Todos</SelectItem>
                                    <SelectItem value="1">Activos</SelectItem>
                                    <SelectItem value="0">Inactivos</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="ml-auto flex items-center gap-3">
                                <span className="hidden text-xs text-muted-foreground sm:inline">{barbers.length} barberos</span>
                                <Link href="/barbershop/barbers/create">
                                    <Button size="sm" className="h-9 gap-1.5"><Plus className="h-4 w-4" />Nuevo Barbero</Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {barbers.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <Users className="h-8 w-8 opacity-30" />
                                <p className="text-sm">No hay barberos registrados.</p>
                                <Link href="/barbershop/barbers/create"><Button variant="outline" size="sm">Nuevo Barbero</Button></Link>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {barbers.map(b => (
                                    <div key={b.id} className="rounded-xl border p-4 hover:bg-muted/20 transition-colors flex flex-col gap-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                                    style={{ backgroundColor: b.color }}
                                                >
                                                    {b.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{b.name}</p>
                                                    {b.email && <p className="text-xs text-muted-foreground">{b.email}</p>}
                                                </div>
                                            </div>
                                            <Badge variant={b.active ? 'secondary' : 'outline'} className="text-[10px]">{b.active ? 'Activo' : 'Inactivo'}</Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Comisión</p>
                                                <p className="font-medium">{b.commission_rate}%</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Citas totales</p>
                                                <p className="font-medium">{b.appointments_count}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {b.accepts_walk_ins && (
                                                <Badge variant="outline" className="text-[10px]">
                                                    <Scissors className="mr-1 h-2.5 w-2.5" />
                                                    Walk-in
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex gap-2 pt-1 border-t">
                                            <Link href={`/barbershop/barbers/${b.id}`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full gap-1.5 h-8 text-xs">
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Ver perfil
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                disabled={deletingId === b.id}
                                                onClick={() => del(b)}
                                            >
                                                {deletingId === b.id ? <Spinner className="h-3 w-3" /> : <Trash2 className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

BarbersIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Barbería', href: '/barbershop' },
        { title: 'Barberos', href: '/barbershop/barbers' },
    ],
};
