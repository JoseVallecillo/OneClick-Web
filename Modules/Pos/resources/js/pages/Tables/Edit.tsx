import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';

interface PosTable {
    id: number;
    number: number;
    section: string;
    shape: 'square' | 'circle';
    capacity: number;
}

interface Props {
    table: PosTable;
    sections: string[];
}

export default function EditTable({ table, sections }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        number:   String(table.number),
        section:  table.section,
        shape:    table.shape,
        capacity: String(table.capacity),
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        put(`/pos/tables/${table.id}`);
    }

    return (
        <AppLayout breadcrumbs={[
            { title: 'POS', href: '/pos/tables' },
            { title: 'Mesas', href: '/pos/tables' },
            { title: `Mesa ${table.number}`, href: '#' },
        ]}>
            <Head title={`Editar Mesa ${table.number}`} />

            <div className="mx-auto max-w-lg p-6">
                <h1 className="text-xl font-bold mb-6">Editar Mesa {table.number}</h1>

                <form onSubmit={submit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="number">Número de mesa</Label>
                            <Input
                                id="number"
                                type="number"
                                min="1"
                                value={data.number}
                                onChange={e => setData('number', e.target.value)}
                            />
                            {errors.number && <p className="text-xs text-destructive">{errors.number}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="capacity">Capacidad (personas)</Label>
                            <Input
                                id="capacity"
                                type="number"
                                min="1"
                                max="50"
                                value={data.capacity}
                                onChange={e => setData('capacity', e.target.value)}
                            />
                            {errors.capacity && <p className="text-xs text-destructive">{errors.capacity}</p>}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="section">Sección</Label>
                        <Input
                            id="section"
                            value={data.section}
                            onChange={e => setData('section', e.target.value)}
                            placeholder="Interior, Terraza, Bar…"
                            list="sections-list"
                        />
                        <datalist id="sections-list">
                            {sections.map(s => <option key={s} value={s} />)}
                        </datalist>
                        {errors.section && <p className="text-xs text-destructive">{errors.section}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Forma</Label>
                        <Select value={data.shape} onValueChange={v => setData('shape', v as 'square' | 'circle')}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="square">Cuadrada / Rectangular</SelectItem>
                                <SelectItem value="circle">Circular / Redonda</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.shape && <p className="text-xs text-destructive">{errors.shape}</p>}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={processing} className="flex-1">
                            {processing ? 'Guardando…' : 'Guardar cambios'}
                        </Button>
                        <Link href="/pos/tables">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
