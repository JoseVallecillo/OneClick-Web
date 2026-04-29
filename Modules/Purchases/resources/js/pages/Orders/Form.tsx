import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Supplier  { id: number; name: string }
interface Warehouse { id: number; name: string }
interface Currency  { id: number; code: string; symbol: string; name: string }
interface Product   { id: number; sku: string; name: string; cost: string; uom_id: number; uom: { abbreviation: string } }

interface OrderLine {
    product_id: string;
    description: string;
    qty: string;
    unit_cost: string;
    tax_rate: string;
}

interface ExistingOrder {
    id: number;
    reference: string;
    supplier_id: number;
    warehouse_id: number;
    currency_id: number;
    expected_date: string | null;
    notes: string | null;
    lines: {
        id: number;
        product_id: number;
        description: string | null;
        qty: string;
        unit_cost: string;
        tax_rate: string;
    }[];
}

interface Props {
    order?: ExistingOrder;
    suppliers: Supplier[];
    warehouses: Warehouse[];
    currencies: Currency[];
    products: Product[];
    primaryCurrency: { id: number; code: string; symbol: string } | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function emptyLine(): OrderLine {
    return { product_id: '', description: '', qty: '1', unit_cost: '0', tax_rate: '0' };
}

function calcLineTotal(line: OrderLine) {
    const sub = parseFloat(line.qty || '0') * parseFloat(line.unit_cost || '0');
    const tax = sub * (parseFloat(line.tax_rate || '0') / 100);
    return { subtotal: sub, tax, total: sub + tax };
}

function fmtNum(n: number) {
    return n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OrderForm({ order, suppliers, warehouses, currencies, products, primaryCurrency }: Props) {
    const isEditing = !!order;
    const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);
    const [searchQuery, setSearchQuery]         = useState('');

    // Detect if we are in "Direct Invoice" mode via query param
    const params = new URLSearchParams(window.location.search);
    const isDirectInvoice = !isEditing && params.get('type') === 'invoice';

    const initialLines: OrderLine[] = isEditing
        ? order!.lines.map((l) => ({
            product_id:  String(l.product_id),
            description: l.description ?? '',
            qty:         l.qty,
            unit_cost:   l.unit_cost,
            tax_rate:    l.tax_rate,
          }))
        : [emptyLine()];

    const { data, setData, post, patch, processing, errors } = useForm({
        supplier_id:      isEditing ? String(order!.supplier_id)  : '',
        warehouse_id:     isEditing ? String(order!.warehouse_id) : '',
        currency_id:      isEditing ? String(order!.currency_id)  : String(primaryCurrency?.id ?? ''),
        expected_date:    isEditing ? (order!.expected_date ?? '') : '',
        notes:            isEditing ? (order!.notes ?? '') : '',
        lines:            initialLines,
        // Invoice fields for direct bit
        direct_invoice:   isDirectInvoice,
        invoice_number:   '',
        invoice_date:     new Date().toISOString().split('T')[0],
        invoice_due_date: '',
    });

    const productMap = new Map(products.map((p) => [String(p.id), p]));

    function addLine() {
        setData('lines', [...data.lines, emptyLine()]);
    }

    function removeLine(idx: number) {
        setData('lines', data.lines.filter((_, i) => i !== idx));
    }

    function updateLine(idx: number, field: keyof OrderLine, value: string) {
        const updated = data.lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l));
        setData('lines', updated);
    }

    function onProductChange(idx: number, productId: string) {
        const product = productMap.get(productId);
        const updated = data.lines.map((l, i) =>
            i === idx
                ? { ...l, product_id: productId, unit_cost: product ? product.cost : '0', description: product ? product.name : l.description }
                : l
        );
        setData('lines', updated);
        setActiveSearchIdx(null);
        setSearchQuery('');
    }

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return [];
        const q = searchQuery.toLowerCase();
        return products.filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.sku.toLowerCase().includes(q)
        ).slice(0, 10);
    }, [searchQuery, products]);

    const grandTotal = data.lines.reduce((sum, l) => sum + calcLineTotal(l).total, 0);
    const currency   = currencies.find((c) => String(c.id) === data.currency_id);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEditing) {
            patch(`/purchases/orders/${order!.id}`);
        } else {
            post('/purchases/orders');
        }
    }

    const pageTitle = isEditing 
        ? `Editar ${order!.reference}` 
        : (isDirectInvoice ? 'Nueva Factura de Compra' : 'Nueva Orden de Compra');

    return (
        <>
            <Head title={pageTitle} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Back + title */}
                <div className="flex items-center gap-3">
                    <Link href={isEditing ? `/purchases/orders/${order!.id}` : '/purchases/orders'}>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            {isEditing ? order!.reference : 'Compras'}
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">
                        {pageTitle}
                    </h1>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* ── Header card ──────────────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Datos generales</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Supplier */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Proveedor <span className="text-destructive">*</span></Label>
                                <Select value={data.supplier_id} onValueChange={(v) => setData('supplier_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar proveedor…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.supplier_id && <p className="text-xs text-destructive">{errors.supplier_id}</p>}
                            </div>

                            {/* Warehouse */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Almacén destino <span className="text-destructive">*</span></Label>
                                <Select value={data.warehouse_id} onValueChange={(v) => setData('warehouse_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar almacén…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((w) => (
                                            <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.warehouse_id && <p className="text-xs text-destructive">{errors.warehouse_id}</p>}
                            </div>

                            {/* Currency */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Moneda <span className="text-destructive">*</span></Label>
                                <Select value={data.currency_id} onValueChange={(v) => setData('currency_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar moneda…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.code} — {c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.currency_id && <p className="text-xs text-destructive">{errors.currency_id}</p>}
                            </div>

                            {/* Expected date (Only for Orders) */}
                            {!isDirectInvoice && (
                                <div className="flex flex-col gap-1.5">
                                    <Label>Fecha de entrega esperada</Label>
                                    <Input type="date" value={data.expected_date} onChange={(e) => setData('expected_date', e.target.value)} />
                                    {errors.expected_date && <p className="text-xs text-destructive">{errors.expected_date}</p>}
                                </div>
                            )}

                            {/* Notes */}
                            <div className={`flex flex-col gap-1.5 ${isDirectInvoice ? 'sm:col-span-3' : 'sm:col-span-2 lg:col-span-2'}`}>
                                <Label>Notas internas</Label>
                                <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={2} placeholder="Instrucciones para el proveedor, referencias, etc." />
                                {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Invoice Information (Direct Mode Only) ──────────────── */}
                    {isDirectInvoice && (
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base text-primary">Información de la Factura</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="flex flex-col gap-1.5">
                                    <Label>Número de Factura <span className="text-destructive">*</span></Label>
                                    <Input value={data.invoice_number} onChange={(e) => setData('invoice_number', e.target.value)} placeholder="Ej: FAC-001" />
                                    {errors.invoice_number && <p className="text-xs text-destructive">{errors.invoice_number}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label>Fecha de Factura <span className="text-destructive">*</span></Label>
                                    <Input type="date" value={data.invoice_date} onChange={(e) => setData('invoice_date', e.target.value)} />
                                    {errors.invoice_date && <p className="text-xs text-destructive">{errors.invoice_date}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label>Fecha de Vencimiento</Label>
                                    <Input type="date" value={data.invoice_due_date} onChange={(e) => setData('invoice_due_date', e.target.value)} />
                                    {errors.invoice_due_date && <p className="text-xs text-destructive">{errors.invoice_due_date}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Lines card ───────────────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Productos a comprar</CardTitle>
                                <Button type="button" size="sm" variant="outline" onClick={addLine} className="flex items-center gap-1.5">
                                    <Plus className="h-3.5 w-3.5" />
                                    Agregar línea
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {errors.lines && <p className="mb-3 text-xs text-destructive">{errors.lines}</p>}

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 pr-2 font-medium" style={{ minWidth: 200 }}>Producto</th>
                                            <th className="pb-2 pr-2 font-medium" style={{ minWidth: 140 }}>Descripción</th>
                                            <th className="pb-2 pr-2 font-medium text-right" style={{ width: 90 }}>Cantidad</th>
                                            <th className="pb-2 pr-2 font-medium text-right" style={{ width: 110 }}>Costo unit.</th>
                                            <th className="pb-2 pr-2 font-medium text-right" style={{ width: 90 }}>Impuesto %</th>
                                            <th className="pb-2 pr-2 font-medium text-right" style={{ width: 110 }}>Total</th>
                                            <th className="pb-2" style={{ width: 36 }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.lines.map((line, idx) => {
                                            const { total } = calcLineTotal(line);
                                            const prod = productMap.get(line.product_id);
                                            return (
                                                <tr key={idx} className="border-b last:border-0">
                                                    <td className="py-2 pr-2">
                                                        <div className="relative">
                                                            <div className="relative">
                                                                <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                                                <Input 
                                                                    className="h-8 pl-8 text-xs font-medium"
                                                                    placeholder="Buscar por nombre o sku..."
                                                                    value={activeSearchIdx === idx ? searchQuery : (prod?.name ?? '')}
                                                                    onChange={(e) => {
                                                                        setActiveSearchIdx(idx);
                                                                        setSearchQuery(e.target.value);
                                                                    }}
                                                                    onFocus={() => {
                                                                        setActiveSearchIdx(idx);
                                                                        setSearchQuery('');
                                                                    }}
                                                                />
                                                            </div>
                                                            
                                                            {activeSearchIdx === idx && filteredProducts.length > 0 && (
                                                                <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-popover border rounded-md shadow-lg p-1">
                                                                    {filteredProducts.map(p => (
                                                                        <button
                                                                            key={p.id}
                                                                            type="button"
                                                                            onClick={() => onProductChange(idx, String(p.id))}
                                                                            className="w-full text-left px-3 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground flex flex-col gap-0.5"
                                                                        >
                                                                            <span className="font-semibold">{p.name}</span>
                                                                            <span className="text-[10px] text-muted-foreground font-mono">{p.sku}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {activeSearchIdx === idx && searchQuery && filteredProducts.length === 0 && (
                                                                <div className="absolute z-50 left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg p-3 text-center text-xs text-muted-foreground">
                                                                    No se encontraron productos
                                                                </div>
                                                            )}
                                                        </div>
                                                        {prod && (
                                                            <div className="mt-1 text-[10px] text-muted-foreground flex gap-2 font-mono">
                                                                <span className="bg-muted px-1 rounded">{prod.sku}</span>
                                                                <span>{prod.uom.abbreviation}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <Input className="h-8 text-xs" value={line.description}
                                                            onChange={(e) => updateLine(idx, 'description', e.target.value)}
                                                            placeholder="Opcional" />
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <Input className="h-8 text-right text-xs tabular-nums" type="number" min="0.01" step="0.01"
                                                            value={line.qty} onChange={(e) => updateLine(idx, 'qty', e.target.value)} />
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <Input className="h-8 text-right text-xs tabular-nums" type="number" min="0" step="0.0001"
                                                            value={line.unit_cost} onChange={(e) => updateLine(idx, 'unit_cost', e.target.value)} />
                                                    </td>
                                                    <td className="py-2 pr-2">
                                                        <Input className="h-8 text-right text-xs tabular-nums" type="number" min="0" max="100" step="0.01"
                                                            value={line.tax_rate} onChange={(e) => updateLine(idx, 'tax_rate', e.target.value)} />
                                                    </td>
                                                    <td className="py-2 pr-2 text-right text-xs tabular-nums font-medium">
                                                        {currency?.symbol} {fmtNum(total)}
                                                    </td>
                                                    <td className="py-2">
                                                        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                            onClick={() => removeLine(idx)} disabled={data.lines.length === 1}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t">
                                            <td colSpan={5} className="pt-3 pr-2 text-right text-sm font-semibold">Total:</td>
                                            <td className="pt-3 pr-2 text-right text-sm font-bold tabular-nums">
                                                {currency?.symbol} {fmtNum(grandTotal)}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.visit(isEditing ? `/purchases/orders/${order!.id}` : '/purchases/orders')}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white shadow-md transition-all active:scale-95">
                            {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isEditing ? 'Guardar cambios' : (isDirectInvoice ? 'Crear factura' : 'Crear orden')}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

OrderForm.layout = (page: React.ReactNode) => {
    return {
        breadcrumbs: [
            { title: 'Panel de Control', href: dashboard() },
            { title: 'Compras', href: '/purchases/orders' },
            { title: 'Orden', href: '#' },
        ],
        children: page
    }
};
