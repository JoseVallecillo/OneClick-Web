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
import { ArrowLeft, Check, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Customer  { id: number; name: string }
interface Warehouse { id: number; name: string }
interface Currency  { id: number; code: string; symbol: string; name: string }
interface Product   { id: number; sku: string; name: string; price: string; uom_id: number; uom: { abbreviation: string } }

interface OrderLine {
    product_id: string;
    description: string;
    qty: string;
    unit_price: string;
    tax_rate: string;
}

interface ExistingOrder {
    id: number;
    reference: string;
    customer_id: number;
    warehouse_id: number;
    currency_id: number;
    delivery_date: string | null;
    quote_expires_at: string | null;
    customer_po_ref: string | null;
    payment_terms: string | null;
    notes: string | null;
    lines: {
        id: number;
        product_id: number;
        description: string | null;
        qty: string;
        unit_price: string;
        tax_rate: string;
    }[];
}

interface Props {
    order?: ExistingOrder;
    customers: Customer[];
    warehouses: Warehouse[];
    currencies: Currency[];
    products: Product[];
    primaryCurrency: { id: number; code: string; symbol: string } | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PAYMENT_TERMS_OPTIONS = [
    { value: 'immediate', label: 'Contado (inmediato)' },
    { value: 'net15',     label: 'Neto 15 días' },
    { value: 'net30',     label: 'Neto 30 días' },
    { value: 'net45',     label: 'Neto 45 días' },
    { value: 'net60',     label: 'Neto 60 días' },
    { value: 'net90',     label: 'Neto 90 días' },
];

function emptyLine(): OrderLine {
    return { product_id: '', description: '', qty: '1', unit_price: '0', tax_rate: '0' };
}

function calcLineTotal(line: OrderLine) {
    const sub = parseFloat(line.qty || '0') * parseFloat(line.unit_price || '0');
    const tax = sub * (parseFloat(line.tax_rate || '0') / 100);
    return { subtotal: sub, tax, total: sub + tax };
}

function fmtNum(n: number) {
    return n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OrderForm({ order, customers, warehouses, currencies, products, primaryCurrency }: Props) {
    const isEditing = !!order;

    const initialLines: OrderLine[] = isEditing
        ? order!.lines.map((l) => ({
            product_id:  String(l.product_id),
            description: l.description ?? '',
            qty:         l.qty,
            unit_price:  l.unit_price,
            tax_rate:    l.tax_rate,
          }))
        : [emptyLine()];

    const { data, setData, post, patch, processing, errors } = useForm({
        customer_id:      isEditing ? String(order!.customer_id)  : '',
        warehouse_id:     isEditing ? String(order!.warehouse_id) : '',
        currency_id:      isEditing ? String(order!.currency_id)  : String(primaryCurrency?.id ?? ''),
        delivery_date:    isEditing ? (order!.delivery_date ?? '') : '',
        quote_expires_at: isEditing ? (order!.quote_expires_at ?? '') : '',
        customer_po_ref:  isEditing ? (order!.customer_po_ref ?? '') : '',
        payment_terms:    isEditing ? (order!.payment_terms ?? '') : '',
        notes:            isEditing ? (order!.notes ?? '') : '',
        lines:            initialLines,
    });

    const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
    const [customerLoading, setCustomerLoading]         = useState(false);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const customerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [lineSuggestions, setLineSuggestions] = useState<Record<number, Product[]>>({});
    const [lineLoading, setLineLoading]         = useState<Record<number, boolean>>({});
    const lineDebounceRef = useRef<Record<number, ReturnType<typeof setTimeout> | null>>({});

    const selectedCustomer = customers.find(c => String(c.id) === data.customer_id);

    // Sync search input with selected customer name
    useEffect(() => {
        if (selectedCustomer && !customerSearchQuery) {
            setCustomerSearchQuery(selectedCustomer.name);
        }
    }, [selectedCustomer, customerSearchQuery]);

    const findCustomers = useCallback(async (q: string) => {
        if (!q || q.length < 2) {
            setCustomerSuggestions([]);
            return;
        }
        setCustomerLoading(true);
        try {
            const res = await fetch(`/contacts/lookup?query=${encodeURIComponent(q.trim())}`);
            const json = await res.json();
            setCustomerSuggestions(json.contacts || []);
        } finally {
            setCustomerLoading(false);
        }
    }, []);

    useEffect(() => {
        if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current);
        if (customerSearchQuery.length >= 2 && (!selectedCustomer || customerSearchQuery !== selectedCustomer.name)) {
            customerDebounceRef.current = setTimeout(() => findCustomers(customerSearchQuery), 300);
        } else if (!customerSearchQuery) {
            setCustomerSuggestions([]);
        }
    }, [customerSearchQuery, findCustomers, selectedCustomer]);

    const findProducts = useCallback(async (idx: number, q: string) => {
        if (!q || q.length < 2) {
            setLineSuggestions(prev => ({ ...prev, [idx]: [] }));
            return;
        }
        setLineLoading(prev => ({ ...prev, [idx]: true }));
        try {
            const res = await fetch(`/inventory/products/lookup?query=${encodeURIComponent(q.trim())}`);
            const json = await res.json();
            setLineSuggestions(prev => ({ ...prev, [idx]: json.products || [] }));
        } finally {
            setLineLoading(prev => ({ ...prev, [idx]: false }));
        }
    }, []);

    const onLineSearchChange = (idx: number, q: string) => {
        const updated = data.lines.map((l, i) => (i === idx ? { ...l, product_search: q } : l));
        setData('lines', updated);

        if (lineDebounceRef.current[idx]) clearTimeout(lineDebounceRef.current[idx]!);
        if (q.length >= 2) {
            lineDebounceRef.current[idx] = setTimeout(() => findProducts(idx, q), 300);
        } else {
            setLineSuggestions(prev => ({ ...prev, [idx]: [] }));
        }
    };

    const [productMap, setProductMap] = useState<Map<string, Product>>(new Map(products.map((p) => [String(p.id), p])));

    function addLine() { setData('lines', [...data.lines, { ...emptyLine(), product_search: '' } as any]); }

    function removeLine(idx: number) {
        setData('lines', data.lines.filter((_, i) => i !== idx));
    }

    function updateLine(idx: number, field: keyof OrderLine, value: string) {
        const updated = data.lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l));
        setData('lines', updated);
    }

    function onProductChange(idx: number, product: Product) {
        const updated = data.lines.map((l, i) =>
            i === idx
                ? { ...l, product_id: String(product.id), unit_price: product.price, product_search: '' }
                : l
        );
        setData('lines', updated as any);
    }

    const grandSubtotal = data.lines.reduce((sum, l) => sum + calcLineTotal(l).subtotal, 0);
    const grandTax      = data.lines.reduce((sum, l) => sum + calcLineTotal(l).tax, 0);
    const grandTotal    = data.lines.reduce((sum, l) => sum + calcLineTotal(l).total, 0);
    const currency      = currencies.find((c) => String(c.id) === data.currency_id);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEditing) {
            patch(`/sales/orders/${order!.id}`);
        } else {
            post('/sales/orders');
        }
    }

    const pageTitle = isEditing ? `Editar ${order!.reference}` : 'Nueva Cotización';

    return (
        <>
            <Head title={pageTitle} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Back + title */}
                <div className="flex items-center gap-3">
                    <Link href={isEditing ? `/sales/orders/${order!.id}` : '/sales/orders'}>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            {isEditing ? order!.reference : 'Ventas'}
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">{pageTitle}</h1>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* ── Header card ──────────────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Datos del cliente</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Customer */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Cliente <span className="text-destructive">*</span></Label>
                                <div className="relative">
                                    <div className="relative flex-1">
                                        <Input
                                            placeholder="Buscar por nombre o RTN..."
                                            value={customerSearchQuery}
                                            onChange={e => {
                                                setCustomerSearchQuery(e.target.value);
                                                if (selectedCustomer && e.target.value !== selectedCustomer.name) {
                                                    setData('customer_id', '');
                                                }
                                            }}
                                            className="h-10 pr-10"
                                            autoComplete="off"
                                        />
                                        {customerLoading ? (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                        ) : customerSearchQuery ? (
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setCustomerSearchQuery('');
                                                    setData('customer_id', '');
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        )}

                                        {/* Suggestions List */}
                                        {customerSuggestions.length > 0 && (
                                            <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-popover border rounded-md shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100">
                                                {customerSuggestions.map(c => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setData('customer_id', String(c.id));
                                                            setCustomerSearchQuery(c.name);
                                                            setCustomerSuggestions([]);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground flex flex-col gap-0.5"
                                                    >
                                                        <span className="font-semibold">{c.name}</span>
                                                        {/* RTN or extra info could go here */}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {selectedCustomer && (
                                        <div className="mt-1 flex items-center gap-1.5 px-1">
                                            <Check className="h-3 w-3 text-green-600" />
                                            <span className="text-[10px] text-muted-foreground">
                                                Seleccionado: <strong>{selectedCustomer.name}</strong> 
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {errors.customer_id && <p className="text-xs text-destructive">{errors.customer_id}</p>}
                            </div>

                            {/* Customer PO Ref */}
                            <div className="flex flex-col gap-1.5">
                                <Label>OC del cliente (referencia)</Label>
                                <Input
                                    value={data.customer_po_ref}
                                    onChange={(e) => setData('customer_po_ref', e.target.value)}
                                    placeholder="Ej: PO-2025-001"
                                    className="font-mono"
                                />
                                {errors.customer_po_ref && <p className="text-xs text-destructive">{errors.customer_po_ref}</p>}
                            </div>

                            {/* Payment Terms */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Condiciones de pago</Label>
                                <Select value={data.payment_terms} onValueChange={(v) => setData('payment_terms', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PAYMENT_TERMS_OPTIONS.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.payment_terms && <p className="text-xs text-destructive">{errors.payment_terms}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Logistics card ───────────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Logística y fechas</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Warehouse */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Almacén origen <span className="text-destructive">*</span></Label>
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

                            {/* Delivery date */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Fecha de entrega prometida</Label>
                                <Input type="date" value={data.delivery_date} onChange={(e) => setData('delivery_date', e.target.value)} />
                                {errors.delivery_date && <p className="text-xs text-destructive">{errors.delivery_date}</p>}
                            </div>

                            {/* Quote expiry */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Vencimiento de la cotización</Label>
                                <Input type="date" value={data.quote_expires_at} onChange={(e) => setData('quote_expires_at', e.target.value)} />
                                {errors.quote_expires_at && <p className="text-xs text-destructive">{errors.quote_expires_at}</p>}
                            </div>

                            {/* Notes */}
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label>Notas internas</Label>
                                <Textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={2}
                                    placeholder="Instrucciones especiales de entrega, acuerdos comerciales, etc."
                                />
                                {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Lines card ───────────────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Productos / Servicios</CardTitle>
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
                                            <th className="pb-2 pr-2 font-medium text-right" style={{ width: 110 }}>Precio unit.</th>
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
                                                    <td className="py-2 pr-2 relative">
                                                        <div className="relative">
                                                            <Input 
                                                                className="h-8 text-xs pr-7" 
                                                                placeholder="Nombre o SKU..."
                                                                value={(line as any).product_search ?? (prod?.name || '')}
                                                                onChange={e => onLineSearchChange(idx, e.target.value)}
                                                                autoComplete="off"
                                                            />
                                                            {lineLoading[idx] ? (
                                                                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-muted-foreground" />
                                                            ) : (line as any).product_search ? (
                                                                <button type="button" onClick={() => onLineSearchChange(idx, '')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            ) : <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />}

                                                            {/* Line Suggestions */}
                                                            {lineSuggestions[idx]?.length > 0 && (
                                                                <div className="absolute z-[60] left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-popover border rounded-md shadow-lg p-1">
                                                                    {lineSuggestions[idx].map(p => (
                                                                        <button
                                                                            key={p.id}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                // Update the local product map and apply change at once
                                                                                setProductMap(prev => new Map(prev).set(String(p.id), p));
                                                                                onProductChange(idx, p);
                                                                                setLineSuggestions(prev => ({ ...prev, [idx]: [] }));
                                                                            }}
                                                                            className="w-full text-left px-2 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground flex flex-col"
                                                                        >
                                                                            <span className="font-bold font-mono text-[9px]">{p.sku}</span>
                                                                            <span className="truncate">{p.name}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {prod && (
                                                            <div className="mt-0.5 text-[10px] text-muted-foreground flex items-center gap-1">
                                                                <span className="font-mono bg-muted px-1 rounded">{prod.sku}</span>
                                                                <span>{prod.uom?.abbreviation}</span>
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
                                                            value={line.unit_price} onChange={(e) => updateLine(idx, 'unit_price', e.target.value)} />
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
                                        <tr>
                                            <td colSpan={5} className="pt-3 pr-2 text-right text-sm text-muted-foreground">Subtotal:</td>
                                            <td className="pt-3 pr-2 text-right text-sm tabular-nums">
                                                {currency?.symbol} {fmtNum(grandSubtotal)}
                                            </td>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <td colSpan={5} className="pt-1 pr-2 text-right text-sm text-muted-foreground">Impuestos:</td>
                                            <td className="pt-1 pr-2 text-right text-sm tabular-nums">
                                                {currency?.symbol} {fmtNum(grandTax)}
                                            </td>
                                            <td></td>
                                        </tr>
                                        <tr className="border-t">
                                            <td colSpan={5} className="pt-2 pr-2 text-right text-sm font-bold">Total:</td>
                                            <td className="pt-2 pr-2 text-right text-sm font-bold tabular-nums">
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
                        <Button type="button" variant="outline"
                            onClick={() => router.visit(isEditing ? `/sales/orders/${order!.id}` : '/sales/orders')}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEditing ? 'Guardar cambios' : 'Crear cotización'}
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
            { title: 'Ventas', href: '/sales/orders' },
            { title: 'Cotización', href: '#' },
        ],
        children: page,
    };
};
