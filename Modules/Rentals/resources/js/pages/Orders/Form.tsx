import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Minus, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const RATE_LABELS: Record<string, string> = {
    hourly: 'Por hora', daily: 'Por día', weekly: 'Por semana', monthly: 'Por mes',
};

const fmt = (n: string | number) =>
    Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Product {
    id: number; sku: string; name: string; tracking: string;
    rental_rate?: {
        hourly_price: string; daily_price: string; weekly_price: string;
        monthly_price: string; deposit_amount: string;
    };
    stock_lots?: { id: number; lot_number: string; qty_available: string }[];
}

interface RentalLine {
    product_id: number | '';
    lot_id: number | '';
    description: string;
    qty: number;
    rate_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
    unit_price: number;
    duration: number;
    discount_pct: number;
    tax_rate: number;
}

interface OrderData {
    id: number; reference: string; status: string;
    customer_id: number; start_date: string; end_date: string;
    pickup_type: string; delivery_address?: string;
    notes?: string; internal_notes?: string;
    lines: Array<RentalLine & { id: number; product: Product; lot?: { id: number; lot_number: string } }>;
}

interface Props {
    order?: OrderData;
    customers: { id: number; name: string }[];
    products: Product[];
}

const emptyLine = (): RentalLine => ({
    product_id: '', lot_id: '', description: '', qty: 1,
    rate_type: 'daily', unit_price: 0, duration: 1, discount_pct: 0, tax_rate: 0,
});

const lineTotal = (l: RentalLine) => {
    const base = l.qty * l.unit_price * l.duration;
    const disc = base * (1 - l.discount_pct / 100);
    return disc + disc * (l.tax_rate / 100);
};

export default function RentalForm({ order, customers, products }: Props) {
    const isEdit = !!order;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Alquileres', href: '/rentals' },
        { title: isEdit ? `Editar ${order!.reference}` : 'Nueva Reserva', href: '#' },
    ];

    const { data, setData, post, patch, processing, errors } = useForm({
        customer_id:      isEdit ? order!.customer_id : ('' as number | ''),
        start_date:       isEdit ? order!.start_date : '',
        end_date:         isEdit ? order!.end_date : '',
        pickup_type:      isEdit ? order!.pickup_type : 'local',
        delivery_address: isEdit ? (order!.delivery_address ?? '') : '',
        notes:            isEdit ? (order!.notes ?? '') : '',
        internal_notes:   isEdit ? (order!.internal_notes ?? '') : '',
        lines:            isEdit
            ? order!.lines.map((l) => ({
                product_id:   l.product_id, lot_id: l.lot_id ?? '',
                description:  l.description ?? '', qty: Number(l.qty),
                rate_type:    l.rate_type, unit_price: Number(l.unit_price),
                duration:     Number(l.duration), discount_pct: Number(l.discount_pct),
                tax_rate:     Number(l.tax_rate),
            }))
            : [emptyLine()],
    });

    // Customer search
    const [customerSearch, setCustomerSearch] = useState(
        isEdit ? customers.find((c) => c.id === order!.customer_id)?.name ?? '' : ''
    );
    const [customerOpen, setCustomerOpen] = useState(false);
    const filteredCustomers = customers.filter((c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase())
    );

    // Availability indicator
    const [availability, setAvailability] = useState<Record<number, boolean>>({});

    const checkAvailability = useCallback(async (productId: number, start: string, end: string) => {
        if (!productId || !start || !end) return;
        try {
            const params = new URLSearchParams({
                product_id: String(productId), start_date: start, end_date: end,
                ...(order ? { exclude_id: String(order.id) } : {}),
            });
            const res = await fetch(`/rentals/lookup/availability?${params}`);
            const json = await res.json();
            setAvailability((prev) => ({ ...prev, [productId]: json.available }));
        } catch {}
    }, [order]);

    useEffect(() => {
        data.lines.forEach((l) => {
            if (l.product_id && data.start_date && data.end_date) {
                checkAvailability(Number(l.product_id), data.start_date, data.end_date);
            }
        });
    }, [data.start_date, data.end_date]);

    const updateLine = (i: number, field: keyof RentalLine, value: any) => {
        const lines = [...data.lines];
        lines[i] = { ...lines[i], [field]: value };

        if (field === 'product_id') {
            const p = products.find((x) => x.id === Number(value));
            if (p?.rental_rate) {
                lines[i].unit_price = Number(p.rental_rate.daily_price);
                lines[i].rate_type  = 'daily';
            }
            lines[i].lot_id = '';
            if (p && data.start_date && data.end_date) {
                checkAvailability(Number(value), data.start_date, data.end_date);
            }
        }

        if (field === 'rate_type') {
            const p = products.find((x) => x.id === Number(lines[i].product_id));
            if (p?.rental_rate) {
                const rateMap: Record<string, string> = {
                    hourly: p.rental_rate.hourly_price, daily: p.rental_rate.daily_price,
                    weekly: p.rental_rate.weekly_price, monthly: p.rental_rate.monthly_price,
                };
                lines[i].unit_price = Number(rateMap[value] ?? 0);
            }
        }

        setData('lines', lines as any);
    };

    const addLine    = () => setData('lines', [...data.lines, emptyLine()] as any);
    const removeLine = (i: number) => setData('lines', data.lines.filter((_, idx) => idx !== i) as any);

    const subtotal   = data.lines.reduce((s, l) => s + l.qty * l.unit_price * l.duration * (1 - l.discount_pct / 100), 0);
    const taxes      = data.lines.reduce((s, l) => { const base = l.qty * l.unit_price * l.duration * (1 - l.discount_pct / 100); return s + base * (l.tax_rate / 100); }, 0);
    const totalDeposit = data.lines.reduce((s, l) => {
        const p = products.find((x) => x.id === Number(l.product_id));
        return s + (p?.rental_rate ? Number(p.rental_rate.deposit_amount) * l.qty : 0);
    }, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            patch(`/rentals/${order!.id}`);
        } else {
            post('/rentals');
        }
    };

    return (
        <>
            <Head title={isEdit ? `Editar ${order!.reference}` : 'Nueva Reserva'} />
            <form onSubmit={handleSubmit}>
                <div className="flex h-full flex-1 flex-col gap-4 p-4">
                    {/* Header ... */}
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => router.visit('/rentals')} className="rounded p-1 hover:bg-muted transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <h1 className="text-xl font-semibold text-foreground">{isEdit ? `Editar ${order!.reference}` : 'Nueva Reserva'}</h1>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-4">
                            {/* Header fields */}
                            <div className="rounded-lg border border-border bg-card p-4">
                                <h2 className="mb-3 font-medium text-foreground">Datos Generales</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Customer */}
                                    <div className="relative">
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Cliente *</label>
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/60" />
                                            <input
                                                type="text"
                                                className="w-full rounded border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                                placeholder="Buscar cliente..."
                                                value={customerSearch}
                                                onChange={(e) => { setCustomerSearch(e.target.value); setCustomerOpen(true); setData('customer_id', ''); }}
                                                onFocus={() => setCustomerOpen(true)}
                                                onBlur={() => setTimeout(() => setCustomerOpen(false), 150)}
                                            />
                                        </div>
                                        {customerOpen && filteredCustomers.length > 0 && (
                                            <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
                                                {filteredCustomers.slice(0, 8).map((c) => (
                                                    <button key={c.id} type="button"
                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent text-foreground"
                                                        onMouseDown={() => { setData('customer_id', c.id); setCustomerSearch(c.name); setCustomerOpen(false); }}>
                                                        {c.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {errors.customer_id && <p className="mt-1 text-xs text-red-500">{errors.customer_id}</p>}
                                    </div>

                                    {/* Pickup type */}
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipo de Entrega *</label>
                                        <select value={data.pickup_type} onChange={(e) => setData('pickup_type', e.target.value)}
                                            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                                            <option value="local">En local</option>
                                            <option value="delivery">A domicilio</option>
                                        </select>
                                    </div>

                                    {/* Dates */}
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha Inicio *</label>
                                        <input type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)}
                                            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                        {errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date}</p>}
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha Fin *</label>
                                        <input type="date" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)}
                                            min={data.start_date}
                                            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                        {errors.end_date && <p className="mt-1 text-xs text-red-500">{errors.end_date}</p>}
                                    </div>

                                    {/* Delivery address */}
                                    {data.pickup_type === 'delivery' && (
                                        <div className="col-span-2">
                                            <label className="mb-1 block text-xs font-medium text-muted-foreground">Dirección de entrega</label>
                                            <input type="text" value={data.delivery_address}
                                                onChange={(e) => setData('delivery_address', e.target.value)}
                                                className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                                placeholder="Calle, colonia, ciudad..." />
                                        </div>
                                    )}

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Notas públicas</label>
                                        <textarea rows={2} value={data.notes} onChange={(e) => setData('notes', e.target.value)}
                                            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Notas internas</label>
                                        <textarea rows={2} value={data.internal_notes} onChange={(e) => setData('internal_notes', e.target.value)}
                                            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                    </div>
                                </div>
                            </div>

                            {/* Lines */}
                            <div className="rounded-lg border border-border bg-card p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <h2 className="font-medium text-foreground">Equipos</h2>
                                    <button type="button" onClick={addLine}
                                        className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                                        <Plus className="h-3 w-3" />Agregar equipo
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {data.lines.map((line, i) => {
                                        const selectedProduct = products.find((p) => p.id === Number(line.product_id));
                                        const lots = selectedProduct?.stock_lots ?? [];
                                        const needsSerial = selectedProduct?.tracking === 'serial';
                                        const isAvailable = line.product_id ? availability[Number(line.product_id)] : undefined;
                                        const lineAmt = lineTotal(line as RentalLine);

                                        return (
                                            <div key={i} className="rounded-lg border border-border p-3">
                                                <div className="grid grid-cols-12 gap-2">
                                                    {/* Product */}
                                                    <div className="col-span-4">
                                                        <label className="mb-1 block text-xs text-muted-foreground">Equipo *</label>
                                                        <select
                                                            value={line.product_id}
                                                            onChange={(e) => updateLine(i, 'product_id', e.target.value ? Number(e.target.value) : '')}
                                                            className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                                        >
                                                            <option value="">Seleccionar...</option>
                                                            {products.map((p) => (
                                                                <option key={p.id} value={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                        {isAvailable === false && (
                                                            <p className="mt-0.5 text-xs text-red-500">No disponible en ese período</p>
                                                        )}
                                                        {isAvailable === true && (
                                                            <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">Disponible</p>
                                                        )}
                                                    </div>

                                                    {/* Serial lot */}
                                                    {needsSerial && (
                                                        <div className="col-span-2">
                                                            <label className="mb-1 block text-xs text-muted-foreground">N° Serie</label>
                                                            <select value={line.lot_id}
                                                                onChange={(e) => updateLine(i, 'lot_id', e.target.value ? Number(e.target.value) : '')}
                                                                className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                                                                <option value="">Sin asignar</option>
                                                                {lots.map((l) => (
                                                                    <option key={l.id} value={l.id}>{l.lot_number}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}

                                                    {/* Rate type */}
                                                    <div className={needsSerial ? 'col-span-2' : 'col-span-3'}>
                                                        <label className="mb-1 block text-xs text-muted-foreground">Tarifa</label>
                                                        <select value={line.rate_type}
                                                            onChange={(e) => updateLine(i, 'rate_type', e.target.value)}
                                                            className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                                                            {Object.entries(RATE_LABELS).map(([k, v]) => (
                                                                <option key={k} value={k}>{v}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="col-span-2">
                                                        <label className="mb-1 block text-xs text-muted-foreground">Precio unit.</label>
                                                        <input type="number" step="0.01" min="0"
                                                            value={line.unit_price}
                                                            onChange={(e) => updateLine(i, 'unit_price', parseFloat(e.target.value) || 0)}
                                                            className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                                    </div>

                                                    {/* Duration */}
                                                    <div className="col-span-1">
                                                        <label className="mb-1 block text-xs text-muted-foreground">Dur.</label>
                                                        <input type="number" step="0.5" min="0.5"
                                                            value={line.duration}
                                                            onChange={(e) => updateLine(i, 'duration', parseFloat(e.target.value) || 1)}
                                                            className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                                    </div>

                                                    {/* Qty */}
                                                    <div className="col-span-1">
                                                        <label className="mb-1 block text-xs text-muted-foreground">Cant.</label>
                                                        <input type="number" step="1" min="1"
                                                            value={line.qty}
                                                            onChange={(e) => updateLine(i, 'qty', parseFloat(e.target.value) || 1)}
                                                            className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                                    </div>

                                                    {/* Tax */}
                                                    <div className="col-span-1">
                                                        <label className="mb-1 block text-xs text-muted-foreground">Imp.%</label>
                                                        <input type="number" step="0.01" min="0" max="100"
                                                            value={line.tax_rate}
                                                            onChange={(e) => updateLine(i, 'tax_rate', parseFloat(e.target.value) || 0)}
                                                            className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                                    </div>

                                                    {/* Discount */}
                                                    <div className="col-span-1">
                                                        <label className="mb-1 block text-xs text-muted-foreground">Desc.%</label>
                                                        <input type="number" step="0.01" min="0" max="100"
                                                            value={line.discount_pct}
                                                            onChange={(e) => updateLine(i, 'discount_pct', parseFloat(e.target.value) || 0)}
                                                            className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                                    </div>

                                                    {/* Total + remove */}
                                                    <div className="col-span-12 flex items-center justify-between border-t border-border pt-2 mt-1">
                                                        <input type="text" placeholder="Descripción personalizada..."
                                                            value={line.description}
                                                            onChange={(e) => updateLine(i, 'description', e.target.value)}
                                                            className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary mr-3" />
                                                        <span className="text-sm font-medium mr-2 text-foreground">{fmt(lineAmt)}</span>
                                                        {data.lines.length > 1 && (
                                                            <button type="button" onClick={() => removeLine(i)}
                                                                className="rounded p-1 text-red-500 hover:bg-red-500/10 transition-colors">
                                                                <Minus className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Summary sidebar */}
                        <div className="space-y-4">
                            <div className="rounded-lg border border-border bg-card p-4">
                                <h2 className="mb-3 font-medium text-foreground">Resumen</h2>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">{fmt(subtotal)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Impuestos</span><span className="text-foreground">{fmt(taxes)}</span></div>
                                    <div className="flex justify-between border-t border-border pt-1 font-semibold text-foreground"><span>Total</span><span>{fmt(subtotal + taxes)}</span></div>
                                    {totalDeposit > 0 && (
                                        <div className="mt-2 flex justify-between rounded bg-blue-500/10 px-2 py-1 text-blue-600 dark:text-blue-400">
                                            <span>Depósito estimado</span><span>{fmt(totalDeposit)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={processing}
                                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                                {processing ? 'Guardando...' : isEdit ? 'Actualizar Reserva' : 'Crear Reserva'}
                            </button>
                            <button type="button" onClick={() => router.visit('/rentals')}
                                className="w-full rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}

RentalForm.layout = (page: React.ReactNode) => {
    const isEdit = !!(page as any).props.order;
    const order = (page as any).props.order;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Alquileres', href: '/rentals' },
        { title: isEdit ? `Editar ${order!.reference}` : 'Nueva Reserva', href: '#' },
    ];
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
