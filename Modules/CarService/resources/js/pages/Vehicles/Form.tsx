import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Car, Loader2, Save } from 'lucide-react';

interface Customer {
    id: number;
    name: string;
}

interface Vehicle {
    id: number;
    plate: string;
    vin: string | null;
    make: string;
    model: string;
    year: number | null;
    color: string | null;
    engine: string | null;
    transmission: string | null;
    customer_id: number | null;
    notes: string | null;
    active: boolean;
}

interface Props {
    vehicle: Vehicle;
    customers: Customer[];
}

const TRANSMISSIONS = [
    { value: 'manual', label: 'Manual' },
    { value: 'automatic', label: 'Automático' },
    { value: 'cvt', label: 'CVT' },
];

export default function VehicleForm({ vehicle, customers }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        plate: vehicle.plate,
        vin: vehicle.vin ?? '',
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year ? String(vehicle.year) : '',
        color: vehicle.color ?? '',
        engine: vehicle.engine ?? '',
        transmission: vehicle.transmission ?? '',
        customer_id: vehicle.customer_id ? String(vehicle.customer_id) : '',
        notes: vehicle.notes ?? '',
        active: vehicle.active,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        patch(`/carservice/vehicles/${vehicle.id}`);
    }

    return (
        <>
            <Head title={`Editar Vehículo: ${vehicle.plate}`} />

            <div className="flex flex-col gap-6 p-4 flex-1">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href="/carservice/vehicles">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            Vehículos
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <Car className="h-5 w-5 text-primary" />
                        {vehicle.plate}
                    </h1>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Información del Vehículo</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            {/* Plate */}
                            <div className="space-y-1.5">
                                <Label htmlFor="plate">Placa *</Label>
                                <Input
                                    id="plate"
                                    value={data.plate}
                                    onChange={e => setData('plate', e.target.value.toUpperCase())}
                                    className={`font-mono uppercase ${errors.plate ? 'border-destructive' : ''}`}
                                />
                                {errors.plate && <p className="text-xs text-destructive">{errors.plate}</p>}
                            </div>

                            {/* VIN */}
                            <div className="space-y-1.5">
                                <Label htmlFor="vin">VIN (Chasis)</Label>
                                <Input
                                    id="vin"
                                    value={data.vin}
                                    onChange={e => setData('vin', e.target.value.toUpperCase())}
                                    className={`font-mono uppercase ${errors.vin ? 'border-destructive' : ''}`}
                                />
                                {errors.vin && <p className="text-xs text-destructive">{errors.vin}</p>}
                            </div>

                            {/* Make */}
                            <div className="space-y-1.5">
                                <Label htmlFor="make">Marca *</Label>
                                <Input
                                    id="make"
                                    value={data.make}
                                    onChange={e => setData('make', e.target.value)}
                                    className={errors.make ? 'border-destructive' : ''}
                                />
                                {errors.make && <p className="text-xs text-destructive">{errors.make}</p>}
                            </div>

                            {/* Model */}
                            <div className="space-y-1.5">
                                <Label htmlFor="model">Modelo *</Label>
                                <Input
                                    id="model"
                                    value={data.model}
                                    onChange={e => setData('model', e.target.value)}
                                    className={errors.model ? 'border-destructive' : ''}
                                />
                                {errors.model && <p className="text-xs text-destructive">{errors.model}</p>}
                            </div>

                            {/* Year */}
                            <div className="space-y-1.5">
                                <Label htmlFor="year">Año</Label>
                                <Input
                                    id="year"
                                    type="number"
                                    value={data.year}
                                    onChange={e => setData('year', e.target.value)}
                                />
                                {errors.year && <p className="text-xs text-destructive">{errors.year}</p>}
                            </div>

                            {/* Color */}
                            <div className="space-y-1.5">
                                <Label htmlFor="color">Color</Label>
                                <Input
                                    id="color"
                                    value={data.color}
                                    onChange={e => setData('color', e.target.value)}
                                />
                                {errors.color && <p className="text-xs text-destructive">{errors.color}</p>}
                            </div>

                            {/* Engine */}
                            <div className="space-y-1.5">
                                <Label htmlFor="engine">Motor</Label>
                                <Input
                                    id="engine"
                                    value={data.engine}
                                    onChange={e => setData('engine', e.target.value)}
                                    placeholder="Ej. 2.4L Turbo"
                                />
                                {errors.engine && <p className="text-xs text-destructive">{errors.engine}</p>}
                            </div>

                            {/* Transmission */}
                            <div className="space-y-1.5">
                                <Label>Transmisión</Label>
                                <Select value={data.transmission} onValueChange={v => setData('transmission', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TRANSMISSIONS.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.transmission && <p className="text-xs text-destructive">{errors.transmission}</p>}
                            </div>

                            {/* Customer */}
                            <div className="space-y-1.5 sm:col-span-2 border-t pt-4">
                                <Label>Dueño / Cliente</Label>
                                <Select value={data.customer_id} onValueChange={v => setData('customer_id', v === 'none' ? '' : v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sin asignar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin asignar</SelectItem>
                                        {customers.map(c => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.customer_id && <p className="text-xs text-destructive">{errors.customer_id}</p>}
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label htmlFor="notes">Notas Internas</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                    rows={3}
                                    placeholder="Observaciones adicionales sobre el vehículo..."
                                />
                                {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                            </div>

                            {/* Active */}
                            <div className="flex items-center gap-2 pt-2 sm:col-span-2">
                                <Checkbox
                                    id="active"
                                    checked={data.active}
                                    onCheckedChange={v => setData('active', v === true)}
                                />
                                <Label htmlFor="active" className="cursor-pointer">Vehículo Activo</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Link href="/carservice/vehicles">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="gap-2">
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

VehicleForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Lubricentro', href: '/carservice/orders' },
        { title: 'Vehículos', href: '/carservice/vehicles' },
        { title: 'Editar' },
    ],
};
