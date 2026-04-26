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
import { ImagePicker } from '@/components/image-picker';
import { dashboard } from '@/routes';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, AlertCircle, Package, Info, Settings2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function ProductForm({ product, categories, uoms, taxRates }: any) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const isEdit = product !== null;

    const { data, setData, post, patch, processing, errors, reset, transform } = useForm({
        sku:         product?.sku          ?? '',
        name:        product?.name         ?? '',
        description: product?.description  ?? '',
        category_id: product?.category_id  ? String(product.category_id) : '__none__',
        uom_id:      product?.uom_id       ? String(product.uom_id)      : '__none__',
        tax_rate_id: product?.tax_rate_id  ? String(product.tax_rate_id) : '__none__',
        type:        product?.type         ?? 'storable',
        tracking:    product?.tracking     ?? 'none',
        valuation:   product?.valuation    ?? 'average',
        cost:        isEdit ? String(product?.cost) : '',
        price:       isEdit ? String(product?.price) : '',
        min_stock:   product?.min_stock    ? String(product.min_stock) : '',
        image_path:  product?.image_path   ?? '',
        active:      product?.active       ?? true,
    });

    const selectedTax = taxRates?.find((t: any) => String(t.id) === data.tax_rate_id) || null;
    const currentTaxRate = Number(selectedTax?.rate) || 0;

    const onPriceChange = (val: string, field: 'price' | 'cost' | 'min_stock') => {
        const normalized = val.replace(',', '.');
        if (normalized === '' || /^-?\d*\.?\d*$/.test(normalized)) {
            setData(field, normalized);
        }
    };

    const taxAmountDisplay = (() => {
        if (data.price === '') return '0.00';
        const base = parseFloat(data.price.replace(',', '.')) || 0;
        let tax = 0;
        if (selectedTax && selectedTax.type !== 'exempt') {
            if (selectedTax.type === 'percentage') tax = base * (currentTaxRate / 100);
            else if (selectedTax.type === 'fixed') tax = currentTaxRate;
        }
        return tax.toFixed(2);
    })();

    const precioTotalDisplay = (() => {
        if (data.price === '') return '';
        const base = parseFloat(data.price.replace(',', '.')) || 0;
        let total = base;
        if (selectedTax && selectedTax.type !== 'exempt') {
            if (selectedTax.type === 'percentage') total = base * (1 + currentTaxRate / 100);
            else if (selectedTax.type === 'fixed') total = base + currentTaxRate;
        }
        return Number.isInteger(total) && !data.price.includes('.') ? String(total) : total.toFixed(2);
    })();

    // Normalize ALL numeric inputs before sending
    transform((data) => ({
        ...data,
        cost: String(data.cost).replace(/,/g, '.'),
        price: String(data.price).replace(/,/g, '.'),
        min_stock: String(data.min_stock).replace(/,/g, '.'),
    }));

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const options = {
            onSuccess: () => {
                if (!isEdit) reset();
            },
            onError: () => {
                // Focus on top of form to see errors
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            preserveState: true,
            preserveScroll: true
        };

        if (isEdit) {
            patch(`/inventory/products/${product.id}`, options as any);
        } else {
            post('/inventory/products', options as any);
        }
    }

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <>
            <Head title={isEdit ? `Editar: ${product.name}` : 'Nuevo Producto'} />
            
            <style dangerouslySetInnerHTML={{ __html: `
                input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                input[type=number] { -moz-appearance: textfield; }
            `}} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <Link href="/inventory/products">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" /> Productos
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">{isEdit ? product.name : 'Nuevo Producto'}</h1>
                </div>

                {/* VISIBLE ERROR SUMMARY */}
                {hasErrors && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-2 flex items-start gap-3 text-red-800">
                        <AlertCircle className="h-5 w-5 mt-0.5" />
                        <div>
                            <p className="font-bold">Hay errores en el formulario:</p>
                            <ul className="list-disc list-inside text-sm mt-1">
                                {Object.values(errors).map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        </div>
                    </div>
                )}

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 font-bold mb-2">
                        {flash.success}
                    </div>
                )}

                <form onSubmit={submit} className="flex flex-col gap-6 pb-20">
                    {/* Identificación */}
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Identificación</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="sku">SKU / Código</Label>
                                <Input id="sku" placeholder="Cod. de barra o SKU" value={data.sku} onChange={(e) => setData('sku', e.target.value)} />
                                {errors.sku && <p className="text-xs text-red-500">{errors.sku}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="name">Nombre del producto *</Label>
                                <Input id="name" placeholder="Ej. Coca Cola 3L" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Clasificación */}
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Clasificación e Impuesto</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <Label>Categoría</Label>
                                <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Sin categoría</SelectItem>
                                        {categories.map((c:any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Impuesto Aplicado</Label>
                                <Select value={data.tax_rate_id} onValueChange={(v) => setData('tax_rate_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar Impuesto" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Sin impuesto (0%)</SelectItem>
                                        {taxRates.map((t:any) => (
                                            <SelectItem key={t.id} value={String(t.id)}>
                                                {t.name} ({t.type === 'fixed' ? `L.${t.rate}` : `${t.rate}%`})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.tax_rate_id && <p className="text-xs text-red-500">{errors.tax_rate_id}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Unidad de Medida *</Label>
                                <Select value={data.uom_id} onValueChange={(v) => setData('uom_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Unidad" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Seleccionar...</SelectItem>
                                        {uoms.map((u:any) => <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.abbreviation})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.uom_id && <p className="text-xs text-red-500">{errors.uom_id}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inventario */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Settings2 className="h-4 w-4" />
                                Configuración de Inventario
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="flex flex-col gap-1.5">
                                <Label>Tipo de Producto</Label>
                                <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="storable">Almacenable</SelectItem>
                                        <SelectItem value="service">Servicio</SelectItem>
                                        <SelectItem value="consumable">Consumible</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && <p className="text-xs text-red-500">{errors.type}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Seguimiento</Label>
                                <Select value={data.tracking} onValueChange={(v) => setData('tracking', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin seguimiento</SelectItem>
                                        <SelectItem value="lot">Por Lote</SelectItem>
                                        <SelectItem value="serial">Por N° de Serie</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.tracking && <p className="text-xs text-red-500">{errors.tracking}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Valuación</Label>
                                <Select value={data.valuation} onValueChange={(v) => setData('valuation', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="average">Costo Promedio</SelectItem>
                                        <SelectItem value="fifo">FIFO (PEPS)</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.valuation && <p className="text-xs text-red-500">{errors.valuation}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="min_stock">Stock Mínimo</Label>
                                <Input 
                                    id="min_stock" 
                                    type="text" 
                                    placeholder="0.00" 
                                    value={data.min_stock} 
                                    onChange={(e) => onPriceChange(e.target.value, 'min_stock')} 
                                />
                                {errors.min_stock && <p className="text-xs text-red-500">{errors.min_stock}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Precios y costos */}
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Precios y costos</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="cost">Costo unitario</Label>
                                <Input id="cost" type="text" placeholder="0.00" value={data.cost} className="text-right" onChange={(e) => onPriceChange(e.target.value, 'cost')} />
                                {errors.cost && <p className="text-xs text-red-500">{errors.cost}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="price" className="text-muted-foreground">Precio neto (Base)</Label>
                                <Input id="price" type="text" placeholder="0.00" value={data.price} className="text-right h-10" onChange={(e) => onPriceChange(e.target.value, 'price')} />
                                {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label className="text-muted-foreground">Monto Impuesto</Label>
                                <div className="h-10 px-3 flex items-center justify-end rounded-md border border-input bg-muted/50 text-muted-foreground font-mono tabular-nums">
                                    + {taxAmountDisplay}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="total" className="text-sm font-bold text-primary">Precio total (PVP)</Label>
                                <Input
                                    id="total"
                                    type="text"
                                    placeholder="0.00"
                                    value={precioTotalDisplay}
                                    className="text-right font-bold h-10 border-primary/40 ring-primary/20 focus:ring-4"
                                    onChange={(e) => {
                                        const val = e.target.value.replace(',', '.');
                                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                                            const net = parseFloat(val) || 0;
                                            let base = net;
                                            if (selectedTax && selectedTax.type !== 'exempt') {
                                                const r = Number(selectedTax.rate) || 0;
                                                if (selectedTax.type === 'percentage') base = net / (1 + r / 100);
                                                else if (selectedTax.type === 'fixed') base = net - r;
                                            }
                                            const roundedBase = Math.round(base * 10000) / 10000;
                                            setData('price', val === '' ? '' : roundedBase.toString());
                                        }
                                    }}
                                />
                                <p className="text-[10px] text-muted-foreground mt-1 text-center italic">Calculado automáticamente desde el PVP</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Información Adicional */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Información Adicional
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="description">Descripción</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Detalles adicionales del producto..."
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="min-h-[120px] resize-none"
                                />
                                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                            </div>
                            <div className="grid gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label>Imagen del Producto</Label>
                                    <ImagePicker
                                        folder="products"
                                        value={data.image_path}
                                        onChange={(val) => setData('image_path', val)}
                                    />
                                    {errors.image_path && <p className="text-xs text-red-500">{errors.image_path}</p>}
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <Checkbox
                                        id="active"
                                        checked={data.active}
                                        onCheckedChange={(v) => setData('active', v === true)}
                                    />
                                    <Label htmlFor="active" className="cursor-pointer font-medium">Producto Activo / Disponible para venta</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Link href="/inventory/products"><Button type="button" variant="outline">Cancelar</Button></Link>
                        <Button type="submit" disabled={processing}>{processing ? 'Guardando...' : (isEdit ? 'Actualizar Producto' : 'Guardar y Limpiar')}</Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ProductForm.layout = {
    breadcrumbs: [
        { title: 'Inventario', href: '/inventory' },
        { title: 'Productos', href: '/inventory/products' },
        { title: 'Gestión', href: '#' },
    ],
};
