import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Minus, Plus, Scissors, ShoppingBag } from 'lucide-react';
import { useState } from 'react';

interface BarberOption {
    id: number; name: string; color: string;
    schedules: { day_of_week: number; is_working: boolean; start_time: string | null; end_time: string | null }[];
}

interface ServiceOption {
    id: number; name: string; price: number; duration_minutes: number;
    category: { id: number; name: string; color: string } | null;
}

interface ClientOption {
    id: number;
    name: string;
    phone: string | null;
    mobile: string | null;
    barbershop_profile: { preferred_barber_id: number | null } | null;
}
interface ProductOption { id: number; name: string; price: number; }

interface AppointmentDetail {
    id: number;
    client_id: number | null;
    client_name: string;
    client_phone: string | null;
    barber_id: number | null;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: string;
    source: string;
    notes: string | null;
    internal_notes: string | null;
    discount: number;
    payment_method: string | null;
    payment_status: string;
    services: { service_id: number | null; service_name: string; duration_minutes: number; price: number }[];
    products: { product_id: number | null; product_name: string; quantity: number; unit_price: number }[];
}

interface Props {
    appointment: AppointmentDetail | null;
    barbers: BarberOption[];
    services: ServiceOption[];
    clients: ClientOption[];
    products: ProductOption[];
    defaultDate: string;
}

type ServiceLine = { service_id: string; service_name: string; duration_minutes: number; price: number };
type ProductLine = { product_id: string; product_name: string; quantity: number; unit_price: number };

function fmtCurrency(n: number) {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2 }).format(n);
}

export default function AppointmentForm({ appointment, barbers, services, clients, products, defaultDate }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const isEdit = appointment !== null;

    const [serviceLines, setServiceLines] = useState<ServiceLine[]>(
        appointment?.services.map(s => ({
            service_id: s.service_id ? String(s.service_id) : '__custom__',
            service_name: s.service_name,
            duration_minutes: s.duration_minutes,
            price: s.price,
        })) ?? []
    );

    const [productLines, setProductLines] = useState<ProductLine[]>(
        appointment?.products.map(p => ({
            product_id: p.product_id ? String(p.product_id) : '__custom__',
            product_name: p.product_name,
            quantity: p.quantity,
            unit_price: p.unit_price,
        })) ?? []
    );

    const [showProducts, setShowProducts] = useState((appointment?.products.length ?? 0) > 0);

    const { data, setData, post, patch, processing, errors } = useForm({
        client_id:        appointment?.client_id ? String(appointment.client_id) : '__none__',
        client_name:      appointment?.client_name ?? '',
        client_phone:     appointment?.client_phone ?? '',
        barber_id:        appointment?.barber_id ? String(appointment.barber_id) : '__none__',
        appointment_date: appointment?.appointment_date ?? defaultDate,
        start_time:       appointment?.start_time?.slice(0, 5) ?? '09:00',
        end_time:         appointment?.end_time?.slice(0, 5) ?? '09:30',
        status:           appointment?.status ?? 'confirmed',
        source:           appointment?.source ?? 'manual',
        notes:            appointment?.notes ?? '',
        internal_notes:   appointment?.internal_notes ?? '',
        discount:         appointment?.discount ?? 0,
        payment_method:   appointment?.payment_method ?? '',
        payment_status:   appointment?.payment_status ?? 'pending',
    });

    function addService(svc?: ServiceOption) {
        if (svc) {
            setServiceLines(prev => [...prev, {
                service_id: String(svc.id),
                service_name: svc.name,
                duration_minutes: svc.duration_minutes,
                price: svc.price,
            }]);
        } else {
            setServiceLines(prev => [...prev, { service_id: '__custom__', service_name: '', duration_minutes: 30, price: 0 }]);
        }
    }

    function removeService(i: number) {
        setServiceLines(prev => prev.filter((_, idx) => idx !== i));
    }

    function updateService(i: number, field: keyof ServiceLine, value: string | number) {
        setServiceLines(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
    }

    function addProduct(prd?: ProductOption) {
        if (prd) {
            setProductLines(prev => [...prev, { product_id: String(prd.id), product_name: prd.name, quantity: 1, unit_price: prd.price }]);
        } else {
            setProductLines(prev => [...prev, { product_id: '__none__', product_name: '', quantity: 1, unit_price: 0 }]);
        }
    }

    function removeProduct(i: number) {
        setProductLines(prev => prev.filter((_, idx) => idx !== i));
    }

    function updateProduct(i: number, field: keyof ProductLine, value: string | number) {
        setProductLines(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
    }

    function selectClient(clientId: string) {
        setData('client_id', clientId);
        if (clientId !== '__none__') {
            const cl = clients.find(c => String(c.id) === clientId);
            if (cl) {
                setData('client_name', cl.name);
                setData('client_phone', cl.phone ?? cl.mobile ?? '');
                const preferredBarberId = cl.barbershop_profile?.preferred_barber_id;
                if (preferredBarberId) setData('barber_id', String(preferredBarberId));
            }
        }
    }

    const servicesTotal = serviceLines.reduce((s, l) => s + Number(l.price), 0);
    const productsTotal = productLines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const subtotal = servicesTotal + productsTotal;
    const total = Math.max(0, subtotal - Number(data.discount));

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            ...data,
            client_id: data.client_id === '__none__' ? null : data.client_id,
            barber_id: data.barber_id === '__none__' ? null : data.barber_id,
            services: serviceLines.map(l => ({
                ...l,
                service_id: l.service_id === '__custom__' ? null : l.service_id,
            })),
            products: productLines.map(l => ({
                ...l,
                product_id: l.product_id === '__none__' ? null : l.product_id,
            })),
        };

        if (isEdit) {
            patch(`/barbershop/appointments/${appointment.id}`, { data: payload } as any);
        } else {
            post('/barbershop/appointments', { data: payload } as any);
        }
    }

    return (
        <>
            <Head title={isEdit ? `Editar Cita: ${appointment.reference}` : 'Nueva Cita'} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <Link href="/barbershop/appointments">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            Citas
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">{isEdit ? `Editar: ${appointment.reference}` : 'Nueva Cita'}</h1>
                </div>

                {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">{flash.success}</div>}
                {flash?.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{flash.error}</div>}

                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* Cliente */}
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Cliente</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <Label>Cliente registrado</Label>
                                <Select value={data.client_id} onValueChange={selectClient}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Cliente sin registro</SelectItem>
                                        {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="client_name">Nombre *</Label>
                                <Input id="client_name" placeholder="Nombre completo" value={data.client_name} onChange={e => setData('client_name', e.target.value)} required />
                                {errors.client_name && <p className="text-xs text-destructive">{errors.client_name}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="client_phone">Teléfono</Label>
                                <Input id="client_phone" placeholder="Número de teléfono" value={data.client_phone} onChange={e => setData('client_phone', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fecha, Hora y Barbero */}
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Programación</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="appointment_date">Fecha *</Label>
                                <Input id="appointment_date" type="date" value={data.appointment_date} onChange={e => setData('appointment_date', e.target.value)} required />
                                {errors.appointment_date && <p className="text-xs text-destructive">{errors.appointment_date}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="start_time">Hora inicio *</Label>
                                <Input id="start_time" type="time" value={data.start_time} onChange={e => setData('start_time', e.target.value)} required />
                                {errors.start_time && <p className="text-xs text-destructive">{errors.start_time}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="end_time">Hora fin *</Label>
                                <Input id="end_time" type="time" value={data.end_time} onChange={e => setData('end_time', e.target.value)} required />
                                {errors.end_time && <p className="text-xs text-destructive">{errors.end_time}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Barbero</Label>
                                <Select value={data.barber_id} onValueChange={v => setData('barber_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Asignar barbero" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Sin asignar</SelectItem>
                                        {barbers.map(b => (
                                            <SelectItem key={b.id} value={String(b.id)}>
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: b.color }} />
                                                    {b.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Servicios */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Scissors className="h-4 w-4" />
                                    Servicios
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Select onValueChange={(v) => { const svc = services.find(s => String(s.id) === v); addService(svc); }}>
                                        <SelectTrigger className="h-8 w-44 text-xs">
                                            <SelectValue placeholder="Agregar servicio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {services.map(s => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.name} — {fmtCurrency(s.price)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => addService()}>
                                        <Plus className="h-3.5 w-3.5" /> Personalizado
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {serviceLines.length === 0 ? (
                                <p className="py-4 text-center text-sm text-muted-foreground">Sin servicios. Agrega uno arriba.</p>
                            ) : (
                                <div className="space-y-3">
                                    {serviceLines.map((line, i) => (
                                        <div key={i} className="grid gap-2 sm:grid-cols-[1fr_80px_100px_auto] items-end">
                                            <div className="flex flex-col gap-1">
                                                <Label className="text-xs">Servicio</Label>
                                                <Input
                                                    placeholder="Nombre del servicio"
                                                    className="h-8 text-sm"
                                                    value={line.service_name}
                                                    onChange={e => updateService(i, 'service_name', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label className="text-xs">Min.</Label>
                                                <Input
                                                    type="number" min="5" className="h-8 text-sm"
                                                    value={line.duration_minutes}
                                                    onChange={e => updateService(i, 'duration_minutes', parseInt(e.target.value) || 30)}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <Label className="text-xs">Precio</Label>
                                                <Input
                                                    type="number" step="0.01" min="0" className="h-8 text-sm"
                                                    value={line.price}
                                                    onChange={e => updateService(i, 'price', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => removeService(i)}>
                                                <Minus className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Productos (optional) */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Checkbox id="show_products" checked={showProducts} onCheckedChange={v => setShowProducts(v === true)} />
                                    <Label htmlFor="show_products" className="cursor-pointer flex items-center gap-1.5 text-base font-semibold">
                                        <ShoppingBag className="h-4 w-4" />
                                        Productos usados
                                    </Label>
                                </div>
                                {showProducts && (
                                    <div className="flex gap-2">
                                        <Select onValueChange={(v) => { const p = products.find(pr => String(pr.id) === v); addProduct(p); }}>
                                            <SelectTrigger className="h-8 w-44 text-xs">
                                                <SelectValue placeholder="Agregar del inventario" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map(p => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {p.name} — {fmtCurrency(p.price)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => addProduct()}>
                                            <Plus className="h-3.5 w-3.5" /> Personalizado
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        {showProducts && (
                            <CardContent className="pt-0">
                                {productLines.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">Sin productos. Agrega uno arriba.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {productLines.map((line, i) => (
                                            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_70px_100px_90px_auto] items-end">
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-xs">Producto</Label>
                                                    <Input
                                                        placeholder="Nombre del producto"
                                                        className="h-8 text-sm"
                                                        value={line.product_name}
                                                        onChange={e => updateProduct(i, 'product_name', e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-xs">Cantidad</Label>
                                                    <Input
                                                        type="number" step="0.01" min="0.01" className="h-8 text-sm"
                                                        value={line.quantity}
                                                        onChange={e => updateProduct(i, 'quantity', parseFloat(e.target.value) || 1)}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-xs">P. Unitario</Label>
                                                    <Input
                                                        type="number" step="0.01" min="0" className="h-8 text-sm"
                                                        value={line.unit_price}
                                                        onChange={e => updateProduct(i, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Label className="text-xs">Total</Label>
                                                    <div className="h-8 flex items-center text-sm font-medium px-3 rounded-md border bg-muted">
                                                        {fmtCurrency(line.quantity * line.unit_price)}
                                                    </div>
                                                </div>
                                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => removeProduct(i)}>
                                                    <Minus className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>

                    {/* Estado y Pago */}
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Estado y Pago</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="flex flex-col gap-1.5">
                                <Label>Estado de la cita</Label>
                                <Select value={data.status} onValueChange={v => setData('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="confirmed">Confirmada</SelectItem>
                                        <SelectItem value="in_progress">En progreso</SelectItem>
                                        <SelectItem value="completed">Completada</SelectItem>
                                        <SelectItem value="cancelled">Cancelada</SelectItem>
                                        <SelectItem value="no_show">No llegó</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Origen</Label>
                                <Select value={data.source} onValueChange={v => setData('source', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">Manual</SelectItem>
                                        <SelectItem value="walk_in">Walk-in</SelectItem>
                                        <SelectItem value="online">En línea</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Método de pago</Label>
                                <Select value={data.payment_method || '__none__'} onValueChange={v => setData('payment_method', v === '__none__' ? '' : v)}>
                                    <SelectTrigger><SelectValue placeholder="Sin especificar" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Sin especificar</SelectItem>
                                        <SelectItem value="cash">Efectivo</SelectItem>
                                        <SelectItem value="card">Tarjeta</SelectItem>
                                        <SelectItem value="transfer">Transferencia</SelectItem>
                                        <SelectItem value="other">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Estado de pago</Label>
                                <Select value={data.payment_status} onValueChange={v => setData('payment_status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pendiente</SelectItem>
                                        <SelectItem value="paid">Pagado</SelectItem>
                                        <SelectItem value="partial">Parcial</SelectItem>
                                        <SelectItem value="refunded">Devuelto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notas y Totales */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Notas</CardTitle></CardHeader>
                            <CardContent className="grid gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="notes">Notas para el cliente</Label>
                                    <textarea
                                        id="notes"
                                        className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                                        placeholder="Instrucciones o preferencias del cliente…"
                                        value={data.notes}
                                        onChange={e => setData('notes', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="internal_notes">Notas internas</Label>
                                    <textarea
                                        id="internal_notes"
                                        className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px]"
                                        placeholder="Notas internas del equipo…"
                                        value={data.internal_notes}
                                        onChange={e => setData('internal_notes', e.target.value)}
                                        rows={2}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Resumen</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Servicios ({serviceLines.length})</span>
                                        <span>{fmtCurrency(servicesTotal)}</span>
                                    </div>
                                    {showProducts && productLines.length > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Productos ({productLines.length})</span>
                                            <span>{fmtCurrency(productsTotal)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>{fmtCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <Label htmlFor="discount" className="text-sm text-muted-foreground">Descuento</Label>
                                        <Input
                                            id="discount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="h-8 w-28 text-sm text-right"
                                            value={data.discount}
                                            onChange={e => setData('discount', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="flex justify-between border-t pt-3 text-base font-bold">
                                        <span>Total</span>
                                        <span>{fmtCurrency(total)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3">
                        <Link href="/barbershop/appointments">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? <><Spinner className="mr-1" />Guardando…</> : isEdit ? 'Actualizar Cita' : 'Crear Cita'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

AppointmentForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Barbería', href: '/barbershop' },
        { title: 'Citas', href: '/barbershop/appointments' },
        { title: 'Detalle', href: '#' },
    ],
};
