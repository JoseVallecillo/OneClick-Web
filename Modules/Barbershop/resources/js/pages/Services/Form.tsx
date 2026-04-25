import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface CategoryOption { id: number; name: string; color: string; }
interface ServiceDetail {
    id: number; name: string; description: string | null; duration_minutes: number;
    price: number; commission_rate: number; active: boolean; category_id: number | null;
}
interface Props { service: ServiceDetail | null; categories: CategoryOption[]; }

export default function ServiceForm({ service, categories }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const isEdit = service !== null;

    const { data, setData, post, patch, processing, errors } = useForm({
        category_id:      service?.category_id ? String(service.category_id) : '__none__',
        name:             service?.name ?? '',
        description:      service?.description ?? '',
        duration_minutes: service?.duration_minutes ?? 30,
        price:            service?.price ?? 0,
        commission_rate:  service?.commission_rate ?? 0,
        active:           service?.active ?? true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) patch(`/barbershop/services/${service.id}`);
        else post('/barbershop/services');
    }

    return (
        <>
            <Head title={isEdit ? `Editar: ${service.name}` : 'Nuevo Servicio'} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <Link href="/barbershop/services">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1"><ArrowLeft className="h-4 w-4" />Servicios</Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">{isEdit ? service.name : 'Nuevo Servicio'}</h1>
                </div>

                {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">{flash.success}</div>}
                {flash?.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{flash.error}</div>}

                <form onSubmit={submit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Datos del Servicio</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label htmlFor="name">Nombre del servicio *</Label>
                                <Input id="name" placeholder="Ej: Corte clásico, Fade, Barba perfilada" value={data.name} onChange={e => setData('name', e.target.value)} required />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label htmlFor="description">Descripción</Label>
                                <textarea
                                    id="description"
                                    className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                                    placeholder="Descripción del servicio…"
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Categoría</Label>
                                <Select value={data.category_id} onValueChange={v => setData('category_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Sin categoría</SelectItem>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                                                    {c.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="duration_minutes">Duración (minutos) *</Label>
                                <Input id="duration_minutes" type="number" min="5" max="480" step="5" placeholder="30" value={data.duration_minutes} onChange={e => setData('duration_minutes', parseInt(e.target.value) || 30)} required />
                                {errors.duration_minutes && <p className="text-xs text-destructive">{errors.duration_minutes}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="price">Precio *</Label>
                                <Input id="price" type="number" step="0.01" min="0" placeholder="0.00" value={data.price} onChange={e => setData('price', parseFloat(e.target.value) || 0)} required />
                                {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="commission_rate">Comisión al barbero (%)</Label>
                                <Input id="commission_rate" type="number" step="0.01" min="0" max="100" placeholder="0" value={data.commission_rate} onChange={e => setData('commission_rate', parseFloat(e.target.value) || 0)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Estado</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Checkbox id="active" checked={data.active} onCheckedChange={v => setData('active', v === true)} />
                                <Label htmlFor="active" className="cursor-pointer">Servicio activo</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Link href="/barbershop/services"><Button type="button" variant="outline">Cancelar</Button></Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? <><Spinner className="mr-1" />Guardando…</> : isEdit ? 'Actualizar Servicio' : 'Crear Servicio'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ServiceForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Barbería', href: '/barbershop' },
        { title: 'Servicios', href: '/barbershop/services' },
        { title: 'Detalle', href: '#' },
    ],
};
