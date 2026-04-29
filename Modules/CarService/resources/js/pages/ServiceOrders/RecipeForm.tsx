import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { Head, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardList, Loader2, Package, Plus, Search, Trash2, X } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Product { id: number; sku: string; name: string; price: string; uom_id: number; uom?: { abbreviation: string } | null }
interface PackageItem { id: number; product_id: number; qty: string; is_suggested: boolean; suggestion_reason: string | null; product: Product }
interface ServicePackage { id: number; name: string; oil_type: string | null; oil_viscosity: string | null; base_price: string; items: PackageItem[] }
interface OrderLine { product_id: string; warehouse_id: string; description: string; qty: string; unit_price: string; tax_rate: string; is_upsell: boolean; upsell_type: string }

interface Props {
    order: {
        id: number; reference: string; vehicle_id: number; customer_id: number;
        oil_type: string | null; oil_viscosity: string | null; service_package_id: number | null;
        lines: (OrderLine & { id: number })[];
        vehicle: { plate: string; make: string; model: string };
    };
    servicePackages: ServicePackage[];
    warehouses: { id: number; name: string }[];
}

const OIL_TYPES = [
    { value: 'mineral',       label: 'Mineral' },
    { value: 'semi_synthetic', label: 'Semi-Sintético' },
    { value: 'synthetic',     label: 'Sintético 100%' },
];

const VISCOSITIES = ['0W-20','5W-20','5W-30','5W-40','10W-30','10W-40','15W-40','20W-50'];

function ProductSearchInput({ value, initialName, onSelect }: { value: string; initialName: string; onSelect: (p: Product) => void }) {
    const [query, setQuery] = useState(initialName);
    const [suggestions, setSuggestions] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const search = useCallback(async (q: string) => {
        if (!q || q.length < 2) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/carservice/products/lookup?query=${encodeURIComponent(q)}`);
            const json = await res.json();
            setSuggestions(json.products || []);
        } catch (e) {
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (query.length >= 2 && query !== initialName) {
            debounceRef.current = setTimeout(() => search(query), 300);
        } else {
            setSuggestions([]);
        }
    }, [query, initialName, search]);

    useEffect(() => {
        if (initialName) setQuery(initialName);
    }, [initialName]);

    return (
        <div className="relative">
            <div className="relative">
                <Input
                    className="h-8 text-[11px] pr-7"
                    placeholder="Buscar producto o SKU..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoComplete="off"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {loading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : query ? (
                        <button type="button" onClick={() => { setQuery(''); setSuggestions([]); }} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                        </button>
                    ) : (
                        <Search className="h-3 w-3 text-muted-foreground" />
                    )}
                </div>
            </div>
            {suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-popover border rounded-md shadow-lg p-1">
                    {suggestions.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                                setQuery(p.name);
                                setSuggestions([]);
                                onSelect(p);
                            }}
                            className="w-full text-left px-2 py-1.5 text-[11px] rounded-sm hover:bg-accent hover:text-accent-foreground flex flex-col cursor-pointer"
                        >
                            <span className="font-semibold">{p.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{p.sku} — L. {parseFloat(p.price).toLocaleString('es-HN', { minimumFractionDigits: 2 })}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function RecipeForm({ order, servicePackages, warehouses }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        service_package_id: order.service_package_id ? String(order.service_package_id) : '',
        oil_type:           order.oil_type ?? '',
        oil_viscosity:      order.oil_viscosity ?? '',
        lines: order.lines.map(l => ({
            product_id: l.product_id ? String(l.product_id) : '',
            warehouse_id: (l as any).warehouse_id ? String((l as any).warehouse_id) : (warehouses.length === 1 ? String(warehouses[0].id) : ''),
            description: l.description ?? '',
            qty: String(l.qty),
            unit_price: String(l.unit_price),
            tax_rate: String(l.tax_rate),
            is_upsell: l.is_upsell,
            upsell_type: l.upsell_type ?? '',
        })),
    });

    function applyPackage(pkgId: string) {
        setData('service_package_id', pkgId);
        const pkg = servicePackages.find(p => String(p.id) === pkgId);
        if (!pkg) return;
        if (pkg.oil_type)      setData('oil_type', pkg.oil_type);
        if (pkg.oil_viscosity) setData('oil_viscosity', pkg.oil_viscosity);
        
        const required = pkg.items.filter(i => !i.is_suggested);
        if (required.length > 0) {
            setData('lines', required.map(i => ({
                product_id:  String(i.product_id),
                warehouse_id: warehouses.length === 1 ? String(warehouses[0].id) : '',
                description: i.product?.name ?? '',
                qty:         String(i.qty),
                unit_price:  String(i.product?.price ?? 0),
                tax_rate:    '0',
                is_upsell:   false,
                upsell_type: '',
            })));
        }
    }

    function addLine() {
        setData('lines', [...data.lines, { 
            product_id: '', 
            warehouse_id: warehouses.length === 1 ? String(warehouses[0].id) : '',
            description: '', 
            qty: '1', 
            unit_price: '0', 
            tax_rate: '0', 
            is_upsell: false, 
            upsell_type: '' 
        }]);
    }

    function removeLine(i: number) {
        setData('lines', data.lines.filter((_, idx) => idx !== i));
    }

    function setLine(i: number, field: keyof OrderLine, value: string | boolean) {
        const updated = [...data.lines];
        (updated[i] as any)[field] = value;
        setData('lines', updated);
    }

    function handleProductSelect(i: number, p: Product) {
        const updated = [...data.lines];
        updated[i].product_id = String(p.id);
        updated[i].description = p.name;
        updated[i].unit_price = p.price;
        setData('lines', updated);
    }

    function lineTotal(line: any) {
        const sub = parseFloat(line.qty || '0') * parseFloat(line.unit_price || '0');
        return sub + sub * (parseFloat(line.tax_rate || '0') / 100);
    }

    const grandTotal = data.lines.reduce((s, l) => s + lineTotal(l), 0);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        patch(`/carservice/orders/${order.id}/recipe`);
    }

    return (
        <>
            <Head title={`Configurar Orden - ${order.reference}`} />

            <div className="flex flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Configuración de Servicios y Materiales</h1>
                        <p className="text-sm text-muted-foreground">Orden: <span className="font-mono font-bold text-primary">{order.reference}</span> — {order.vehicle.plate}</p>
                    </div>
                    <Badge variant="outline" className="px-3 py-1">En Proceso</Badge>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" />Receta de Servicio</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="space-y-1">
                                    <Label>Paquete / Combo</Label>
                                    <Select value={data.service_package_id} onValueChange={applyPackage}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar paquete…" /></SelectTrigger>
                                        <SelectContent>
                                            {servicePackages.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Tipo de aceite</Label>
                                    <Select value={data.oil_type} onValueChange={v => setData('oil_type', v)}>
                                        <SelectTrigger><SelectValue placeholder="Tipo…" /></SelectTrigger>
                                        <SelectContent>
                                            {OIL_TYPES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Viscosidad</Label>
                                    <Select value={data.oil_viscosity} onValueChange={v => setData('oil_viscosity', v)}>
                                        <SelectTrigger><SelectValue placeholder="Ej. 5W-30" /></SelectTrigger>
                                        <SelectContent>
                                            {VISCOSITIES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Upsell suggestions */}
                            {data.service_package_id && (() => {
                                const pkg = servicePackages.find(p => String(p.id) === data.service_package_id);
                                const suggested = pkg?.items.filter(i => i.is_suggested) ?? [];
                                if (!suggested.length) return null;
                                return (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:bg-blue-950/20">
                                        <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">Sugerencias recomendadas</p>
                                        <div className="flex flex-wrap gap-2">
                                            {suggested.map(i => (
                                                <button
                                                    key={i.id}
                                                    type="button"
                                                    onClick={() => setData('lines', [...data.lines, {
                                                        product_id: String(i.product_id),
                                                        warehouse_id: warehouses.length === 1 ? String(warehouses[0].id) : '',
                                                        description: i.product?.name ?? '',
                                                        qty: String(i.qty),
                                                        unit_price: String(i.product?.price ?? 0),
                                                        tax_rate: '0',
                                                        is_upsell: true,
                                                        upsell_type: 'other',
                                                    }])}
                                                    className="rounded-full border border-blue-300 bg-white px-3 py-1 text-xs text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200"
                                                >
                                                    + {i.product?.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Lines table */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Detalle de Materiales y Servicios</Label>
                                <div className="rounded-md border p-1 bg-muted/5">
                                    <div className="grid grid-cols-12 gap-1 text-[11px] font-medium text-muted-foreground px-2 py-1">
                                        <span className="col-span-3">Producto / Labor</span>
                                        <span className="col-span-3">Almacén</span>
                                        <span className="col-span-1 text-right">Cant.</span>
                                        <span className="col-span-2 text-right">Precio Unit.</span>
                                        <span className="col-span-1 text-right">Imp.%</span>
                                        <span className="col-span-2 text-right pr-6">Subtotal</span>
                                    </div>

                                    <div className="space-y-1">
                                        {data.lines.map((line, i) => (
                                            <div key={i} className="group grid grid-cols-12 gap-1 p-1 items-center hover:bg-muted/30 rounded">
                                                <div className="col-span-3">
                                                    <ProductSearchInput
                                                        value={line.product_id}
                                                        initialName={line.description}
                                                        onSelect={(p) => handleProductSelect(i, p)}
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Select value={line.warehouse_id} onValueChange={v => setLine(i, 'warehouse_id', v)}>
                                                        <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="Almacén…" /></SelectTrigger>
                                                        <SelectContent>
                                                            {warehouses.map((w: { id: number; name: string }) => <SelectItem key={w.id} value={String(w.id)} className="text-[11px]">{w.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="col-span-1">
                                                    <Input type="number" value={line.qty} onChange={e => setLine(i, 'qty', e.target.value)} className="h-8 text-[11px] text-right" />
                                                </div>
                                                <div className="col-span-2">
                                                    <Input type="number" value={line.unit_price} onChange={e => setLine(i, 'unit_price', e.target.value)} className="h-8 text-[11px] text-right" />
                                                </div>
                                                <div className="col-span-1">
                                                    <Input type="number" value={line.tax_rate} onChange={e => setLine(i, 'tax_rate', e.target.value)} className="h-8 text-[11px] text-right" />
                                                </div>
                                                <div className="col-span-2 flex items-center justify-end gap-1 pr-1">
                                                    <span className="text-[11px] font-medium tabular-nums">{lineTotal(line).toLocaleString('es-HN', { minimumFractionDigits: 2 })}</span>
                                                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100" onClick={() => removeLine(i)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {errors.lines && <p className="text-sm text-red-600 p-2">{errors.lines as string}</p>}

                                    <div className="flex items-center justify-between border-t p-2 bg-muted/20 mt-2 rounded-b">
                                        <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1.5 h-8">
                                            <Plus className="h-3.5 w-3.5" /> Agregar ítem
                                        </Button>
                                        <div className="text-right">
                                            <span className="text-xs text-muted-foreground mr-2">Total Orden:</span>
                                            <span className="text-lg font-bold text-primary tabular-nums">
                                                L. {grandTotal.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => history.back()}>Regresar</Button>
                        <Button type="submit" disabled={processing || data.lines.length === 0} className="px-8">
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar y Crear Orden
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

RecipeForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Lubricentro', href: '/carservice/orders' },
        { title: 'Configurar Orden' },
    ],
};
