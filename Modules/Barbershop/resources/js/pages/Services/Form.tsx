import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, ExternalLink } from 'lucide-react';

interface ProductOption { id: number; name: string; price: number; }
interface ConfigDetail {
    id: number;
    product_id: number;
    duration_minutes: number;
    commission_rate: number;
    active: boolean;
    product: ProductOption | null;
}
interface Props { config: ConfigDetail | null; products: ProductOption[]; }

function fmtCurrency(n: number) {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2 }).format(n);
}

export default function ServiceForm({ config, products }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const isEdit = config !== null;

    const { data, setData, post, patch, processing, errors } = useForm({
        product_id:       config ? String(config.product_id) : '__none__',
        duration_minutes: config?.duration_minutes ?? 30,
        commission_rate:  config?.commission_rate ?? 0,
        active:           config?.active ?? true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) patch(`/barbershop/services/${config.id}`);
        else post('/barbershop/services');
    }

    return (
        <>
            <Head title={isEdit ? `Editar: ${config.product?.name ?? 'Servicio'}` : 'Configurar Servicio'} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <Link href="/barbershop/services">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />Servicios
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">
                        {isEdit ? config.product?.name ?? 'Editar Servicio' : 'Configurar Servicio'}
                    </h1>
                </div>

                {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">{flash.success}</div>}
                {flash?.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{flash.error}</div>}

                <form onSubmit={submit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Producto de Inventario</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            {isEdit ? (
                                <div className="flex flex-col gap-1.5 sm:col-span-2">
                                    <Label>Producto</Label>
                                    <div className="flex items-center justify-between rounded-md border bg-muted px-3 py-2 text-sm">
                                        <span className="font-medium">{config.product?.name ?? '—'}</span>
                                        <div className="flex items-center gap-3 text-muted-foreground text-xs">
                                            <span>{config.product ? fmtCurrency(config.product.price) : ''}</span>
                                            <Link href={`/inventory/products/${config.product_id}/edit`} className="flex items-center gap-1 hover:text-primary">
                                                <ExternalLink className="h-3 w-3" /> Editar precio
                                            </Link>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Para cambiar el producto, elimina esta configuración y crea una nueva.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1.5 sm:col-span-2">
                                    <Label>Producto *</Label>
                                    {products.length === 0 ? (
                                        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                                            Todos los productos activos ya están configurados como servicios.{' '}
                                            <Link href="/inventory/products/create" className="text-primary hover:underline">Crear nuevo producto</Link>
                                        </div>
                                    ) : (
                                        <Select value={data.product_id} onValueChange={v => setData('product_id', v)}>
                                            <SelectTrigger><SelectValue placeholder="Seleccionar producto del inventario" /></SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {p.name} — {fmtCurrency(p.price)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {errors.product_id && <p className="text-xs text-destructive">{errors.product_id}</p>}
                                    <p className="text-xs text-muted-foreground">
                                        El precio se gestiona desde Inventario.{' '}
                                        <Link href="/inventory/products/create" className="text-primary hover:underline">Crear nuevo producto</Link>
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Configuración de Barbería</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="duration_minutes">Duración (minutos) *</Label>
                                <Input
                                    id="duration_minutes"
                                    type="number" min="5" max="480" step="5"
                                    placeholder="30"
                                    value={data.duration_minutes}
                                    onChange={e => setData('duration_minutes', parseInt(e.target.value) || 30)}
                                    required
                                />
                                {errors.duration_minutes && <p className="text-xs text-destructive">{errors.duration_minutes}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="commission_rate">Comisión al barbero (%)</Label>
                                <Input
                                    id="commission_rate"
                                    type="number" step="0.01" min="0" max="100"
                                    placeholder="0"
                                    value={data.commission_rate}
                                    onChange={e => setData('commission_rate', parseFloat(e.target.value) || 0)}
                                />
                                {errors.commission_rate && <p className="text-xs text-destructive">{errors.commission_rate}</p>}
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
                        <Button type="submit" disabled={processing || (!isEdit && data.product_id === '__none__')}>
                            {processing ? <><Spinner className="mr-1" />Guardando…</> : isEdit ? 'Actualizar' : 'Configurar Servicio'}
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
