import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BedDouble, Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';

interface RoomRow {
    id: number;
    room_number: string;
    floor: number;
    status: RoomStatus;
    room_type: { name: string };
}

const STATUS_LABELS: Record<RoomStatus, string> = {
    available:   'Disponible',
    occupied:    'Ocupado',
    cleaning:    'Limpieza',
    maintenance: 'Mantenimiento',
};

const STATUS_CLASS: Record<RoomStatus, string> = {
    available:   'border-green-300 bg-green-50 text-green-700',
    occupied:    'border-cyan-300 bg-cyan-50 text-cyan-700',
    cleaning:    'border-amber-300 bg-amber-50 text-amber-700',
    maintenance: 'border-red-300 bg-red-50 text-red-700',
};

export default function RoomsIndex({ rooms }: { rooms: RoomRow[] }) {
    const { props } = usePage<{ flash?: { success?: string }; errors?: Record<string, string> }>();
    const flash = props.flash;
    const errors = props.errors ?? {};
    const [deletingId, setDeletingId] = useState<number | null>(null);

    function deleteRoom(r: RoomRow) {
        if (!confirm(`¿Eliminar la habitación ${r.room_number}?`)) return;
        setDeletingId(r.id);
        router.delete(`/hospitality/rooms/${r.id}`, { onFinish: () => setDeletingId(null) });
    }

    return (
        <>
            <Head title="Habitaciones" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>
                )}
                {errors.room && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{errors.room}</div>
                )}

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{rooms.length} habitación(es)</span>
                            <Link href="/hospitality/rooms/create">
                                <Button size="sm" variant="outline" className="h-9 gap-1.5 bg-white text-black border-zinc-200 hover:bg-zinc-100 dark:bg-white dark:text-black">
                                    <Plus className="h-4 w-4" /> Nueva Habitación
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {rooms.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <BedDouble className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No hay habitaciones configuradas.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                            <th className="pb-2 pr-4 font-semibold">Número</th>
                                            <th className="pb-2 pr-4 font-semibold">Piso</th>
                                            <th className="pb-2 pr-4 font-semibold">Tipo</th>
                                            <th className="pb-2 pr-4 font-semibold">Estado</th>
                                            <th className="pb-2 font-semibold">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rooms.map((r) => (
                                            <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="py-2.5 pr-4 font-mono font-bold text-sm">{r.room_number}</td>
                                                <td className="py-2.5 pr-4 text-xs text-muted-foreground">Piso {r.floor}</td>
                                                <td className="py-2.5 pr-4 text-[13px]">{r.room_type.name}</td>
                                                <td className="py-2.5 pr-4">
                                                    <Badge className={`text-[10px] border ${STATUS_CLASS[r.status]}`}>
                                                        {STATUS_LABELS[r.status]}
                                                    </Badge>
                                                </td>
                                                <td className="py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/hospitality/rooms/${r.id}/edit`}>
                                                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                                                                <Edit className="h-3.5 w-3.5" /> Editar
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                            disabled={deletingId === r.id}
                                                            onClick={() => deleteRoom(r)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

RoomsIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Hotelería', href: '/hospitality/rooms' },
        { title: 'Habitaciones', href: '/hospitality/rooms/list' },
    ],
};
