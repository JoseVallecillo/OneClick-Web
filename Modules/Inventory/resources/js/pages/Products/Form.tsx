import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProductDetail {
    id: number;
    sku: string;
    name: string;
    description: string | null;
    category_id: number;
    uom_id: number;
    tax_rate_id: number | null;
    type: string;
    tracking: string;
    valuation: string;
    cost: number;
    price: number;
    min_stock: number;
    active: boolean;
}

interface SelectOption {
    id: number;
    name: string;
    abbreviation?: string;
    rate?: number;
}

interface TaxRate {
    id: number;
    name: string;
    code: string;
    type: 'percentage' | 'fixed' | 'exempt';
    rate: number;
}

interface Props {
    product: ProductDetail | null;
    categories: SelectOption[];
    uoms: SelectOption[];
    taxRates: TaxRate[];
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProductForm({ product, categories, uoms, taxRates }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const isEdit = product !== null;

    const { data, setData, post, patch, processing, errors } = useForm({
        sku:         product?.sku          ?? '',
        name:        product?.name         ?? '',
        description: product?.description  ?? '',
        category_id: product?.category_id  ? String(product.category_id) : '__none__',
        uom_id:      product?.uom_id       ? String(product.uom_id)      : '__none__',
        tax_rate_id: product?.tax_rate_id  ? String(product.tax_rate_id) : '__none__',
        type:        product?.type         ?? 'storable',
        tracking:    product?.tracking     ?? 'none',
        valuation:   product?.valuation    ?? 'average',
        cost:        product?.cost         ?? 0,
        price:       product?.price        ?? 0,
        min_stock:   product?.min_stock    ?? 0,
        active:      product?.active       ?? true,
    });

    const isService = data.type === 'service';
    const trackingDisabled = isService;
    const valuationDisabled = isService || data.tracking === 'none';

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            patch(`/inventory/products/${product.id}`);
        } else {
            post('/inventory/products');
        }
    }

    return (
        <>
            <Head title={isEdit ? `Editar: ${product.name}` : 'Nuevo Producto'} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href="/inventory/products">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            Productos
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">
                        {isEdit ? product.name : 'Nuevo Producto'}
                    </h1>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* ── Card 1: Identificación ─────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Identificación</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="sku">SKU / Código</Label>
                                <Input
                                    id="sku"
                                    placeholder="PROD-001"
                                    className="font-mono"
                                    value={data.sku}
                                    onChange={(e) => setData('sku', e.target.value)}
                                />
                                {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="name">Nombre *</Label>
                                <Input
                                    id="name"
                                    placeholder="Nombre del producto"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label htmlFor="description">Descripción</Label>
                                <textarea
                                    id="description"
                                    className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                                    placeholder="Descripción detallada del producto…"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Card 2: Clasificación ──────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Clasificación</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Category */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Categoría</Label>
                                <Select
                                    value={data.category_id}
                                    onValueChange={(v) => setData('category_id', v)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Seleccionar categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Sin categoría</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category_id && <p className="text-xs text-destructive">{errors.category_id}</p>}
                            </div>

                            {/* UoM */}
                            {!isService && (
                                <div className="flex flex-col gap-1.5">
                                    <Label>Unidad de Medida</Label>
                                    <Select
                                        value={data.uom_id}
                                        onValueChange={(v) => setData('uom_id', v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Seleccionar UoM" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">Sin unidad</SelectItem>
                                            {uoms.map((u) => (
                                                <SelectItem key={u?.id} value={String(u?.id)}>
                                                    {u?.name}{u?.abbreviation ? ` (${u.abbreviation})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.uom_id && <p className="text-xs text-destructive">{errors.uom_id}</p>}
                                </div>
                            )}

                            {/* Tax rate */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Impuesto</Label>
                                <Select
                                    value={data.tax_rate_id}
                                    onValueChange={(v) => setData('tax_rate_id', v)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Sin impuesto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Sin impuesto</SelectItem>
                                        {taxRates.map((t) => (
                                            <SelectItem key={t.id} value={String(t.id)}>
                                                {t.name} {t.type === 'exempt' ? '(Exento)' : t.type === 'fixed' ? `(L.${t.rate})` : `(${t.rate}%)`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Type */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Tipo de producto</Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(v) => {
                                        setData('type', v);
                                        if (v === 'service') {
                                            setData('tracking', 'none');
                                            setData('valuation', 'average');
                                            setData('uom_id', '__none__');
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="storable">Almacenable</SelectItem>
                                        <SelectItem value="service">Servicio</SelectItem>
                                        <SelectItem value="consumable">Consumible</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && <p className="text-xs text-destructive">{errors.type}</p>}
                            </div>

                            {/* Tracking */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Rastreo</Label>
                                <Select
                                    value={data.tracking}
                                    onValueChange={(v) => {
                                        setData('tracking', v);
                                        if (v === 'none') setData('valuation', 'average');
                                    }}
                                    disabled={trackingDisabled}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin rastreo</SelectItem>
                                        <SelectItem value="lot">Por lotes</SelectItem>
                                        <SelectItem value="serial">Por serie</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.tracking && <p className="text-xs text-destructive">{errors.tracking}</p>}
                            </div>

                            {/* Valuation */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Método de valuación</Label>
                                <Select
                                    value={data.valuation}
                                    onValueChange={(v) => setData('valuation', v)}
                                    disabled={valuationDisabled}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="average">Costo Promedio</SelectItem>
                                        <SelectItem value="fifo">FIFO (PEPS)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.valuation && <p className="text-xs text-destructive">{errors.valuation}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Card 3: Precios y costos ───────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Precios y costos</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="cost">Costo unitario</Label>
                                <Input
                                    id="cost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={data.cost}
                                    onChange={(e) => setData('cost', parseFloat(e.target.value) || 0)}
                                />
                                {errors.cost && <p className="text-xs text-destructive">{errors.cost}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="price">Precio de venta</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={data.price}
                                    onChange={(e) => setData('price', parseFloat(e.target.value) || 0)}
                                />
                                {errors.price && <p className="text-xs text-destructive">{errors.price}</p>}
                            </div>

                            {!isService && (
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="min_stock">Stock mínimo</Label>
                                    <Input
                                        id="min_stock"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0"
                                        value={data.min_stock}
                                        onChange={(e) => setData('min_stock', parseFloat(e.target.value) || 0)}
                                    />
                                    {errors.min_stock && <p className="text-xs text-destructive">{errors.min_stock}</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Card 4: Estado ─────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Estado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="active"
                                    checked={data.active}
                                    onCheckedChange={(v) => setData('active', v === true)}
                                />
                                <Label htmlFor="active" className="cursor-pointer">Producto activo</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex justify-end gap-3">
                        <Link href="/inventory/products">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? <><Spinner className="mr-1" />Guardando…</>
                                : isEdit ? 'Actualizar producto' : 'Crear producto'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ProductForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Inventario', href: '/inventory' },
        { title: 'Productos', href: '/inventory/products' },
        { title: 'Detalle', href: '#' },
    ],
};
