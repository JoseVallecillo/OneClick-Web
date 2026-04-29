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
import { ArrowLeft, AlertCircle, ChefHat, Info, Plus, Settings2, Tag, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Check, Search } from 'lucide-react';

type RecipeLine    = { ingredient_id: string; qty: string };
type IngredientOpt = { id: number | string; name: string; sku: string; uom?: { abbreviation: string } | null };
type ExtraPrice    = { name: string; price: string };

function GlobalIngredientAdder({ ingredients, onAdd }: { ingredients: IngredientOpt[]; onAdd: (id: string) => void }) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const filtered = useMemo(() => {
        if (!search.trim()) return ingredients.slice(0, 50);
        const q = search.toLowerCase();
        return ingredients.filter(i => 
            i.name.toLowerCase().includes(q) || 
            i.sku.toLowerCase().includes(q)
        ).slice(0, 100);
    }, [search, ingredients]);

    return (
        <div ref={wrapperRef} className="relative w-full max-w-sm mb-3">
            <div className={`flex bg-background border rounded-md items-center px-3 h-10 transition-colors ${open ? 'border-primary ring-1 ring-primary/20' : 'border-input'}`}>
                <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                <input 
                    ref={inputRef}
                    value={search}
                    onChange={e => { setSearch(e.target.value); setOpen(true); }}
                    onFocus={() => setOpen(true)}
                    placeholder="Buscar y agregar ingrediente o insumo..."
                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                />
            </div>
            
            {open && (
                <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] max-h-60 overflow-y-auto bg-popover border border-border rounded-md shadow-md p-1">
                    {filtered.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No se encontraron ingredientes.
                        </div>
                    ) : (
                        filtered.map(p => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                    onAdd(String(p.id));
                                    setSearch('');
                                    setOpen(false);
                                    setTimeout(() => inputRef.current?.focus(), 50);
                                }}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                                <div className="flex flex-col items-start gap-0.5 text-left">
                                    <span className="font-semibold text-xs">{p.name}</span>
                                    <span className="text-[10px] text-muted-foreground">SKU: {p.sku}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default function ProductForm({ product, categories, uoms, taxRates, ingredients }: any) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const isEdit = product !== null;

    const [showPrices,    setShowPrices]    = useState(() => (product?.prices?.length ?? 0) > 0);
    const [showExtraInfo, setShowExtraInfo] = useState(() => !!(product?.description || product?.image_path));
    const [showClothing,  setShowClothing]  = useState(() => product?.is_clothing ?? false);

    const { data, setData, post, patch, processing, errors, reset, transform } = useForm({
        sku:                  product?.sku                  ?? '',
        name:                 product?.name                 ?? '',
        description:          product?.description          ?? '',
        category_id:          product?.category_id  ? String(product.category_id) : '__none__',
        uom_id:               product?.uom_id       ? String(product.uom_id)      : '__none__',
        tax_rate_id:          product?.tax_rate_id  ? String(product.tax_rate_id) : '__none__',
        type:                 product?.type                 ?? 'storable',
        tracking:             product?.tracking             ?? 'none',
        valuation:            product?.valuation            ?? 'average',
        cost:                 isEdit ? String(product?.cost) : '',
        price:                isEdit ? String(product?.price) : '',
        min_stock:            product?.min_stock    ? String(product.min_stock) : '',
        image_path:           product?.image_path           ?? '',
        active:               product?.active               ?? true,
        has_recipe:           product?.has_recipe           ?? false,
        is_clothing:          product?.is_clothing          ?? false,
        material:             product?.material             ?? '',
        care_instructions:    product?.care_instructions    ?? '',
        size_guide:           product?.size_guide           ?? '',
        recipe:               (product?.recipe_lines ?? []).map((l: any) => ({
            ingredient_id: String(l.ingredient_id),
            qty:           String(l.qty),
        })) as RecipeLine[],
        extra_prices:         (product?.prices ?? []).map((p: any) => ({
            name:  p.name,
            price: String(p.price),
        })) as ExtraPrice[],
    });

    function addExtraPrice() {
        setData('extra_prices', [...data.extra_prices, { name: '', price: '' }]);
    }

    function removeExtraPrice(index: number) {
        setData('extra_prices', data.extra_prices.filter((_: ExtraPrice, i: number) => i !== index));
    }

    function updateExtraPrice(index: number, field: keyof ExtraPrice, value: string) {
        const updated = data.extra_prices.map((p: ExtraPrice, i: number) =>
            i === index ? { ...p, [field]: value } : p
        );
        setData('extra_prices', updated);
    }

    function addRecipeLine() {
        setData('recipe', [...data.recipe, { ingredient_id: '__none__', qty: '1' }]);
    }

    function addIngredientToRecipe(id: string) {
        // Prevent duplicate lines if possible, or just append it
        if (data.recipe.find((l: RecipeLine) => l.ingredient_id === id)) {
            // Un pequeño aviso o simplemente ignóralo si lo prefieres, pero permitiremos repetidos o incrementaremos
            const updated = data.recipe.map((l: RecipeLine) => 
                l.ingredient_id === id ? { ...l, qty: String((parseFloat(l.qty) || 0) + 1) } : l
            );
            setData('recipe', updated);
        } else {
            setData('recipe', [...data.recipe, { ingredient_id: id, qty: '1' }]);
        }
    }

    function removeRecipeLine(index: number) {
        setData('recipe', data.recipe.filter((_: RecipeLine, i: number) => i !== index));
    }

    function updateRecipeLine(index: number, field: keyof RecipeLine, value: string) {
        const updated = data.recipe.map((line: RecipeLine, i: number) =>
            i === index ? { ...line, [field]: value } : line
        );
        setData('recipe', updated);
    }

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

    transform((d) => ({
        ...d,
        cost:         String(d.cost).replace(/,/g, '.'),
        price:        String(d.price).replace(/,/g, '.'),
        min_stock:    String(d.min_stock).replace(/,/g, '.'),
        recipe:       d.recipe.filter((l: RecipeLine) => l.ingredient_id !== '__none__' && parseFloat(l.qty) > 0),
        extra_prices: d.extra_prices
            .filter((p: ExtraPrice) => p.name.trim() !== '')
            .map((p: ExtraPrice) => ({ ...p, price: String(p.price).replace(/,/g, '.') })),
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
                                <Label>Usa Lote / Serie</Label>
                                <Select value={data.tracking} onValueChange={(v) => setData('tracking', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No — sin trazabilidad</SelectItem>
                                        <SelectItem value="lot">Sí — por Lote</SelectItem>
                                        <SelectItem value="serial">Sí — por N° de Serie</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-[10px] text-muted-foreground">
                                    {data.tracking === 'lot'    && 'En operaciones se pedirá el número de lote.'}
                                    {data.tracking === 'serial' && 'En operaciones se pedirá el número de serie (qty = 1).'}
                                    {data.tracking === 'none'   && 'No se pedirá lote ni serie en operaciones.'}
                                </p>
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

                    {/* Lista de Precios */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Tag className="h-4 w-4" />
                                    Lista de Precios Adicionales
                                </CardTitle>
                                <div className="flex items-center gap-3">
                                    {showPrices && (
                                        <Button type="button" variant="outline" size="sm" onClick={addExtraPrice} className="flex items-center gap-1.5">
                                            <Plus className="h-4 w-4" /> Agregar Precio
                                        </Button>
                                    )}
                                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-input accent-primary"
                                            checked={showPrices}
                                            onChange={(e) => {
                                                setShowPrices(e.target.checked);
                                                if (!e.target.checked) setData('extra_prices', []);
                                            }}
                                        />
                                        Activar precios
                                    </label>
                                </div>
                            </div>
                            {showPrices && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Precios alternativos para este producto (Mayoreo, Detalle, Especial, etc.)
                                </p>
                            )}
                        </CardHeader>
                        {showPrices && <CardContent className="pt-0">
                            {data.extra_prices.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic text-center py-4">
                                    Sin precios adicionales. Usa el botón "Agregar Precio" para añadir.
                                </p>
                            ) : (
                                <div className="overflow-x-auto rounded-md border border-input">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/30 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                <th className="px-3 py-2">Nombre / Etiqueta</th>
                                                <th className="px-3 py-2 w-40">Precio</th>
                                                <th className="px-3 py-2 w-12 text-center">X</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.extra_prices.map((row: ExtraPrice, i: number) => (
                                                <tr key={i} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                                    <td className="px-3 py-2">
                                                        <Input
                                                            type="text"
                                                            placeholder="Ej. Precio Mayoreo"
                                                            value={row.name}
                                                            onChange={(e) => updateExtraPrice(i, 'name', e.target.value)}
                                                            className="h-9"
                                                        />
                                                        {(errors as any)[`extra_prices.${i}.name`] && (
                                                            <p className="text-xs text-red-500">{(errors as any)[`extra_prices.${i}.name`]}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <Input
                                                            type="text"
                                                            inputMode="decimal"
                                                            placeholder="0.00"
                                                            value={row.price}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(',', '.');
                                                                if (val === '' || /^\d*\.?\d*$/.test(val)) updateExtraPrice(i, 'price', val);
                                                            }}
                                                            className="h-9 text-right tabular-nums font-mono"
                                                        />
                                                        {(errors as any)[`extra_prices.${i}.price`] && (
                                                            <p className="text-xs text-red-500">{(errors as any)[`extra_prices.${i}.price`]}</p>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() => removeExtraPrice(i)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>}
                    </Card>

                    {/* Información Adicional */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    Información Adicional
                                </CardTitle>
                                <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-input accent-primary"
                                        checked={showExtraInfo}
                                        onChange={(e) => {
                                            setShowExtraInfo(e.target.checked);
                                            if (!e.target.checked) {
                                                setData('description', '');
                                                setData('image_path', '');
                                            }
                                        }}
                                    />
                                    Activar info. adicional
                                </label>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-3 pt-0">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="active"
                                    checked={data.active}
                                    onCheckedChange={(v) => setData('active', v === true)}
                                />
                                <Label htmlFor="active" className="cursor-pointer font-medium">Producto Activo / Disponible para venta</Label>
                            </div>
                        </CardContent>
                        {showExtraInfo && (
                        <CardContent className="grid gap-6 sm:grid-cols-2 pt-0 border-t">
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
                            <div className="flex flex-col gap-1.5">
                                <Label>Imagen del Producto</Label>
                                <ImagePicker
                                    folder="products"
                                    value={data.image_path}
                                    onChange={(val) => setData('image_path', val)}
                                />
                                {errors.image_path && <p className="text-xs text-red-500">{errors.image_path}</p>}
                            </div>
                        </CardContent>
                        )}
                    </Card>

                    {/* Información de Ropa */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Información de Ropa</CardTitle>
                                <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-input accent-primary"
                                        checked={data.is_clothing}
                                        onChange={(e) => {
                                            setData('is_clothing', e.target.checked);
                                            setShowClothing(e.target.checked);
                                            if (!e.target.checked) {
                                                setData('material', '');
                                                setData('care_instructions', '');
                                                setData('size_guide', '');
                                            }
                                        }}
                                    />
                                    Es producto de ropa
                                </label>
                            </div>
                            {data.is_clothing && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Agrega información específica para prendas de vestir como material, cuidados y guía de talles.
                                </p>
                            )}
                        </CardHeader>
                        {data.is_clothing && (
                        <CardContent className="grid gap-4 sm:grid-cols-2 pt-0 border-t">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="material">Material / Composición</Label>
                                <Input
                                    id="material"
                                    placeholder="Ej. 100% algodón, 80% poliéster 20% spandex"
                                    value={data.material}
                                    onChange={(e) => setData('material', e.target.value)}
                                />
                                {errors.material && <p className="text-xs text-red-500">{errors.material}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="size_guide">Guía de Talles</Label>
                                <Input
                                    id="size_guide"
                                    placeholder="Ej. XS, S, M, L, XL, XXL"
                                    value={data.size_guide}
                                    onChange={(e) => setData('size_guide', e.target.value)}
                                />
                                {errors.size_guide && <p className="text-xs text-red-500">{errors.size_guide}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label htmlFor="care_instructions">Instrucciones de Cuidado</Label>
                                <Textarea
                                    id="care_instructions"
                                    placeholder="Ej. Lavar en agua fría. No usar blanqueador. Secar al aire."
                                    value={data.care_instructions}
                                    onChange={(e) => setData('care_instructions', e.target.value)}
                                    className="min-h-[80px] resize-none"
                                />
                                {errors.care_instructions && <p className="text-xs text-red-500">{errors.care_instructions}</p>}
                            </div>
                        </CardContent>
                        )}
                    </Card>

                    {/* Receta */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <ChefHat className="h-4 w-4" />
                                    Receta / Ingredientes
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-input accent-primary"
                                            checked={data.has_recipe}
                                            onChange={(e) => {
                                                setData('has_recipe', e.target.checked);
                                                if (!e.target.checked) setData('recipe', []);
                                            }}
                                        />
                                        Activar receta
                                    </label>
                                </div>
                            </div>
                            {data.has_recipe && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Define los insumos/ingredientes que consume este artículo al venderse en el POS.
                                </p>
                            )}
                        </CardHeader>

                        {data.has_recipe && (
                            <CardContent className="pt-0">
                                <GlobalIngredientAdder 
                                    ingredients={ingredients as IngredientOpt[]} 
                                    onAdd={addIngredientToRecipe} 
                                />
                                
                                <div className="overflow-x-auto rounded-md border border-input">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/30 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                <th className="px-3 py-2">Ingrediente / Insumo</th>
                                                <th className="px-3 py-2 w-24 text-center">Unidad</th>
                                                <th className="px-3 py-2 w-32">Cantidad</th>
                                                <th className="px-3 py-2 w-12 text-center">X</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.recipe.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="py-10 text-center text-xs text-muted-foreground italic">
                                                        La receta está vacía. Usa el buscador de arriba para agregar ingredientes.
                                                    </td>
                                                </tr>
                                            )}
                                            {data.recipe.map((line: RecipeLine, i: number) => {
                                                const ingredientInfo = (ingredients as IngredientOpt[]).find(ing => String(ing.id) === line.ingredient_id);
                                                return (
                                                    <tr key={i} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                                        <td className="px-3 py-2">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-sm">{ingredientInfo?.name || 'Cargando...'}</span>
                                                                <span className="text-[10px] text-muted-foreground">SKU: {ingredientInfo?.sku || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <span className="text-xs font-mono text-muted-foreground">
                                                                {ingredientInfo?.uom?.abbreviation ?? '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <Input
                                                                type="text"
                                                                inputMode="decimal"
                                                                placeholder="1"
                                                                value={line.qty}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) updateRecipeLine(i, 'qty', val);
                                                                }}
                                                                className="h-9 text-right tabular-nums font-mono"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                onClick={() => removeRecipeLine(i)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        )}
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
