import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import { Head, useForm } from '@inertiajs/react';
import { Save } from 'lucide-react';

interface RoomType {
    id?: number;
    name: string;
    base_price: string;
    capacity_adults: number;
    capacity_kids: number;
}

interface Props {
    roomType?: RoomType;
}

export default function RoomTypeForm({ roomType }: Props) {
    const isEdit = !!roomType;

    const { data, setData, post, patch, processing, errors } = useForm({
        name:             roomType?.name ?? '',
        base_price:       roomType?.base_price ?? '',
        capacity_adults:  roomType?.capacity_adults ?? 2,
        capacity_kids:    roomType?.capacity_kids ?? 0,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            patch(`/hospitality/room-types/${roomType!.id}`);
        } else {
            post('/hospitality/room-types');
        }
    }

    return (
        <>
            <Head title={isEdit ? 'Editar Tipo' : 'Nuevo Tipo de Habitación'} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Card className="max-w-lg">
                    <CardHeader>
                        <CardTitle className="text-base">{isEdit ? 'Editar Tipo de Habitación' : 'Nuevo Tipo de Habitación'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="name">Nombre</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ej. Suite Deluxe"
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="base_price">Precio Base (L.)</Label>
                                <Input
                                    id="base_price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.base_price}
                                    onChange={(e) => setData('base_price', e.target.value)}
                                    placeholder="0.00"
                                />
                                {errors.base_price && <p className="text-xs text-destructive">{errors.base_price}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="capacity_adults">Capacidad Adultos</Label>
                                    <Input
                                        id="capacity_adults"
                                        type="number"
                                        min="1"
                                        value={data.capacity_adults}
                                        onChange={(e) => setData('capacity_adults', Number(e.target.value))}
                                    />
                                    {errors.capacity_adults && <p className="text-xs text-destructive">{errors.capacity_adults}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="capacity_kids">Capacidad Niños</Label>
                                    <Input
                                        id="capacity_kids"
                                        type="number"
                                        min="0"
                                        value={data.capacity_kids}
                                        onChange={(e) => setData('capacity_kids', Number(e.target.value))}
                                    />
                                    {errors.capacity_kids && <p className="text-xs text-destructive">{errors.capacity_kids}</p>}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button type="submit" disabled={processing} className="gap-1.5">
                                    <Save className="h-4 w-4" />
                                    {isEdit ? 'Guardar Cambios' : 'Crear Tipo'}
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

RoomTypeForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Hotelería', href: '/hospitality/rooms' },
        { title: 'Tipos de Habitación', href: '/hospitality/room-types' },
        { title: 'Formulario', href: '#' },
    ],
};
