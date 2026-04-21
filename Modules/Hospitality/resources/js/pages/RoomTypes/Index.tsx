import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BedDouble, Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface RoomTypeRow {
    id: number;
    name: string;
    base_price: string;
    capacity_adults: number;
    capacity_kids: number;
    rooms_count: number;
}

export default function RoomTypesIndex({ types }: { types: RoomTypeRow[] }) {
    const { props } = usePage<{ flash?: { success?: string }; errors?: Record<string, string> }>();
    const flash = props.flash;
    const errors = props.errors ?? {};
    const [deletingId, setDeletingId] = useState<number | null>(null);

    function deleteType(t: RoomTypeRow) {
        if (!confirm(`¿Eliminar el tipo "${t.name}"?`)) return;
        setDeletingId(t.id);
        router.delete(`/hospitality/room-types/${t.id}`, { onFinish: () => setDeletingId(null) });
    }

    return (
        <>
            <Head title="Tipos de Habitación" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>
                )}
                {errors.roomType && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{errors.roomType}</div>
                )}

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{types.length} tipo(s)</span>
                            <Link href="/hospitality/room-types/create">
                                <Button size="sm" variant="outline" className="h-9 gap-1.5 bg-white text-black border-zinc-200 hover:bg-zinc-100 dark:bg-white dark:text-black">
                                    <Plus className="h-4 w-4" /> Nuevo Tipo
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {types.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <BedDouble className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No hay tipos de habitación configurados.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                            <th className="pb-2 pr-4 font-semibold">Nombre</th>
                                            <th className="pb-2 pr-4 font-semibold">Precio Base</th>
                                            <th className="pb-2 pr-4 font-semibold">Capacidad</th>
                                            <th className="pb-2 pr-4 font-semibold">Habitaciones</th>
                                            <th className="pb-2 font-semibold">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {types.map((t) => (
                                            <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="py-2.5 pr-4 font-medium text-[13px]">{t.name}</td>
                                                <td className="py-2.5 pr-4 font-mono text-xs tabular-nums">L. {Number(t.base_price).toFixed(2)}</td>
                                                <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                                                    {t.capacity_adults} adulto(s){t.capacity_kids > 0 ? `, ${t.capacity_kids} niño(s)` : ''}
                                                </td>
                                                <td className="py-2.5 pr-4">
                                                    <Badge className="text-[10px] border border-zinc-200 bg-zinc-50 text-zinc-600">
                                                        {t.rooms_count}
                                                    </Badge>
                                                </td>
                                                <td className="py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/hospitality/room-types/${t.id}/edit`}>
                                                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                                                                <Edit className="h-3.5 w-3.5" /> Editar
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                            disabled={t.rooms_count > 0 || deletingId === t.id}
                                                            title={t.rooms_count > 0 ? 'Tiene habitaciones asignadas' : ''}
                                                            onClick={() => deleteType(t)}
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

RoomTypesIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Hotelería', href: '/hospitality/rooms' },
        { title: 'Tipos de Habitación', href: '/hospitality/room-types' },
    ],
};
