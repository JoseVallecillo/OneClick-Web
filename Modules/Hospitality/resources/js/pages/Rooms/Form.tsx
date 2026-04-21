import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { Head, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';

interface RoomType {
    id: number;
    name: string;
    base_price: string;
}

interface Room {
    id?: number;
    room_number: string;
    floor: number;
    room_type_id: number;
    status: string;
}

interface Props {
    room?: Room;
    roomTypes: RoomType[];
}

const STATUSES = [
    { value: 'available',    label: 'Disponible' },
    { value: 'occupied',     label: 'Ocupado' },
    { value: 'cleaning',     label: 'Limpieza' },
    { value: 'maintenance',  label: 'Mantenimiento' },
];

export default function RoomForm({ room, roomTypes }: Props) {
    const isEdit = !!room;

    const { data, setData, post, patch, processing, errors } = useForm({
        room_number:  room?.room_number ?? '',
        floor:        room?.floor ?? 1,
        room_type_id: room?.room_type_id ?? (roomTypes[0]?.id ?? ''),
        status:       room?.status ?? 'available',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            patch(`/hospitality/rooms/${room!.id}`);
        } else {
            post('/hospitality/rooms');
        }
    }

    return (
        <>
            <Head title={isEdit ? 'Editar Habitación' : 'Nueva Habitación'} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Card className="max-w-lg">
                    <CardHeader>
                        <CardTitle className="text-base">{isEdit ? 'Editar Habitación' : 'Nueva Habitación'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="room_number">Número de Habitación</Label>
                                    <Input
                                        id="room_number"
                                        value={data.room_number}
                                        onChange={(e) => setData('room_number', e.target.value)}
                                        placeholder="Ej. 101"
                                        maxLength={10}
                                    />
                                    {errors.room_number && <p className="text-xs text-destructive">{errors.room_number}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="floor">Piso</Label>
                                    <Input
                                        id="floor"
                                        type="number"
                                        min="0"
                                        value={data.floor}
                                        onChange={(e) => setData('floor', Number(e.target.value))}
                                    />
                                    {errors.floor && <p className="text-xs text-destructive">{errors.floor}</p>}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="room_type_id">Tipo de Habitación</Label>
                                <Select
                                    value={String(data.room_type_id)}
                                    onValueChange={(v) => setData('room_type_id', Number(v))}
                                >
                                    <SelectTrigger id="room_type_id">
                                        <SelectValue placeholder="Selecciona un tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roomTypes.map((t) => (
                                            <SelectItem key={t.id} value={String(t.id)}>
                                                {t.name} — L. {Number(t.base_price).toFixed(2)}/noche
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.room_type_id && <p className="text-xs text-destructive">{errors.room_type_id}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="status">Estado</Label>
                                <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                    <SelectTrigger id="status">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUSES.map((s) => (
                                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-xs text-destructive">{errors.status}</p>}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={processing} className="gap-1.5">
                                    <Save className="h-4 w-4" />
                                    {isEdit ? 'Guardar Cambios' : 'Crear Habitación'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => history.back()}>
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

RoomForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Hotelería', href: '/hospitality/rooms' },
        { title: 'Habitaciones', href: '/hospitality/rooms/list' },
        { title: 'Formulario', href: '#' },
    ],
};
