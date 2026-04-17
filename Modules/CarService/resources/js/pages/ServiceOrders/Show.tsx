import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowRight, Calendar, Car, CheckCircle2, ClipboardList, Plus, QrCode, Wrench } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type OrderStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';
type FilterStatus = 'good' | 'dirty' | 'replace';

interface OrderLine {
    id: number; description: string | null; qty: string; unit_price: string;
    tax_rate: string; subtotal: string; tax_amount: string; total: string;
    is_upsell: boolean; upsell_type: string | null;
    product: { id: number; name: string; sku: string; uom: { abbreviation: string } | null } | null;
}

interface ServiceOrder {
    id: number; reference: string; status: OrderStatus;
    odometer_in: number; odometer_out: number | null;
    oil_type: string | null; oil_viscosity: string | null;
    next_service_km: number | null; next_service_date: string | null;
    qr_token: string | null;
    photo_front: string | null; photo_side: string | null; photo_rear: string | null;
    inspection_notes: string | null;
    brake_fluid_pct: string | null; air_filter_status: FilterStatus | null;
    cabin_filter_status: FilterStatus | null; battery_voltage: string | null;
    checks_notes: string | null;
    subtotal: string; tax_amount: string; total: string;
    checked_in_at: string | null; completed_at: string | null;
    notes: string | null;
    vehicle: { id: number; plate: string; make: string; model: string; year: number | null; color: string | null; vin: string | null };
    customer: { id: number; name: string };
    service_package: { id: number; name: string } | null;
    creator: { id: number; name: string };
    lines: OrderLine[];
}

interface HistoryRow {
    id: number; reference: string; oil_type: string | null; oil_viscosity: string | null;
    odometer_out: number | null; completed_at: string | null; next_service_km: number | null; total: string;
}

interface Props { order: ServiceOrder; history: HistoryRow[] }

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<OrderStatus, { label: string; className: string }> = {
    draft:       { label: 'Borrador',   className: 'border-gray-300 bg-gray-50 text-gray-600' },
    in_progress: { label: 'En Proceso', className: 'border-blue-300 bg-blue-50 text-blue-700' },
    completed:   { label: 'Realizado',   className: 'border-green-300 bg-green-50 text-green-700' },
    cancelled:   { label: 'Cancelado',  className: 'border-red-300 bg-red-50 text-red-700' },
};

const FILTER_MAP: Record<FilterStatus, { label: string; color: string }> = {
    good:    { label: 'Bueno',      color: 'text-green-600' },
    dirty:   { label: 'Sucio',      color: 'text-amber-600' },
    replace: { label: 'Reemplazar', color: 'text-red-600' },
};

const OIL_LABELS: Record<string, string> = {
    mineral: 'Mineral', semi_synthetic: 'Semi-Sintético', synthetic: 'Sintético 100%',
};

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-HN', { year: 'numeric', month: 'short', day: '2-digit' });
}
function fmtNum(v: string | number) {
    return Number(v).toLocaleString('es-HN', { minimumFractionDigits: 2 });
}
function fmtKm(n: number | null) { return n ? n.toLocaleString('es-HN') + ' km' : '—'; }

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Show({ order, history }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const statusInfo = STATUS_MAP[order.status];
    const publicUrl = order.qr_token ? `${window.location.origin}/cs/history/${order.qr_token}` : null;

    return (
        <>
            <Head title={`Orden ${order.reference}`} />

            <div className="flex flex-col gap-6 p-4">

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        {flash.success}
                    </div>
                )}

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold font-mono">{order.reference}</h1>
                            <Badge className={`border ${statusInfo.className}`}>
                                {order.status === 'draft' ? 'Check-in (Recibido)' : statusInfo.label}
                            </Badge>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {order.vehicle.make} {order.vehicle.model} {order.vehicle.year ?? ''} —
                            <span className="font-mono ml-1">{order.vehicle.plate}</span>
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {order.status === 'draft' && (
                            <Button 
                                size="sm" 
                                className="gap-1.5 bg-blue-600 hover:bg-blue-700"
                                onClick={() => router.post(`/carservice/orders/${order.id}/convert`)}
                            >
                                <ArrowRight className="h-4 w-4" /> Convertir a Orden
                            </Button>
                        )}
                        {order.status === 'in_progress' && (
                            <>
                                <Link href={`/carservice/orders/${order.id}/edit`}>
                                    <Button size="sm">Editar Check-in</Button>
                                </Link>
                                <Link href={`/carservice/orders/${order.id}/complete`}>
                                    <Button size="sm" className="gap-1.5">
                                        <CheckCircle2 className="h-4 w-4" /> Completar servicio
                                    </Button>
                                </Link>
                            </>
                        )}
                        {(order.status === 'draft' || order.status === 'in_progress') && (
                            <Button
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-input"
                                onClick={() => router.post(`/carservice/orders/${order.id}/cancel`, {}, { preserveScroll: true })}
                            >
                                Cancelar
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        {/* ── Vehículo y servicio ─────────────────────────── */}
                        <Card>
                            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Car className="h-4 w-4" />Vehículo y Servicio</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                <div><span className="text-xs text-muted-foreground block">Cliente</span>{order.customer.name}</div>
                                <div><span className="text-xs text-muted-foreground block">Vehículo</span>{order.vehicle.make} {order.vehicle.model} {order.vehicle.year ?? ''}</div>
                                <div><span className="text-xs text-muted-foreground block">Placa</span><span className="font-mono font-bold">{order.vehicle.plate}</span></div>
                                <div><span className="text-xs text-muted-foreground block">Odómetro entrada</span>{fmtKm(order.odometer_in)}</div>
                                <div><span className="text-xs text-muted-foreground block">Odómetro salida</span>{fmtKm(order.odometer_out)}</div>
                                <div><span className="text-xs text-muted-foreground block">Aceite</span>{order.oil_type ? `${OIL_LABELS[order.oil_type]} ${order.oil_viscosity ?? ''}` : '—'}</div>
                                {order.service_package && <div><span className="text-xs text-muted-foreground block">Paquete</span>{order.service_package.name}</div>}
                                <div><span className="text-xs text-muted-foreground block">Check-in</span>{fmtDate(order.checked_in_at)}</div>
                                {order.completed_at && <div><span className="text-xs text-muted-foreground block">Completado</span>{fmtDate(order.completed_at)}</div>}
                            </CardContent>
                        </Card>

                        {/* ── Fotos de inspección ─────────────────────────── */}
                        {(order.photo_front || order.photo_side || order.photo_rear) && (
                            <Card>
                                <CardHeader><CardTitle className="text-sm">Inspección Visual</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { src: order.photo_front, label: 'Frontal' },
                                            { src: order.photo_side,  label: 'Lateral' },
                                            { src: order.photo_rear,  label: 'Trasera' },
                                        ].map(({ src, label }) => src ? (
                                            <div key={label} className="space-y-1">
                                                <span className="text-[11px] text-muted-foreground">{label}</span>
                                                <a href={`/storage/${src}`} target="_blank" rel="noreferrer">
                                                    <img src={`/storage/${src}`} alt={label} className="h-28 w-full rounded-lg object-cover border hover:opacity-80 transition" />
                                                </a>
                                            </div>
                                        ) : null)}
                                    </div>
                                    {order.inspection_notes && (
                                        <p className="text-xs text-muted-foreground italic">{order.inspection_notes}</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* ── Líneas de servicio ──────────────────────────── */}
                        <Card>
                            <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4" />Servicios y Productos</CardTitle>
                                {order.status === 'in_progress' && order.lines.length > 0 && (
                                    <Link href={`/carservice/orders/${order.id}/recipe`}>
                                        <Button size="sm" className="h-7 px-3 text-[11px] gap-1">
                                            <Plus className="h-3 w-3" /> Agregar / Editar
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </CardHeader>
                            <CardContent>
                                {order.lines.length === 0 ? (
                                    <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground">
                                        <Wrench className="h-8 w-8 opacity-20" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">No se han definido servicios para esta orden.</p>
                                            {order.status === 'draft' ? (
                                                <p className="text-xs">El vehículo ha sido recibido. Convierta el check-in en una <strong>Orden de Trabajo</strong> para agregar productos y servicios.</p>
                                            ) : (
                                                <p className="text-xs">La orden está abierta pero aún no tiene una receta asignada.</p>
                                            )}
                                        </div>
                                        {order.status === 'draft' && (
                                            <Button 
                                                variant="outline" 
                                                className="mt-2"
                                                onClick={() => router.post(`/carservice/orders/${order.id}/convert`)}
                                            >
                                                <ArrowRight className="mr-2 h-4 w-4" /> Generar Orden de Trabajo
                                            </Button>
                                        )}
                                        {order.status === 'in_progress' && (
                                            <Link href={`/carservice/orders/${order.id}/recipe`}>
                                                <Button variant="default" className="mt-2 bg-primary hover:bg-primary/90 shadow-md">
                                                    <Plus className="mr-2 h-4 w-4" /> Crear Orden de Trabajo
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground text-xs">
                                                <th className="pb-2 pr-3 font-medium">Descripción</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Cant.</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Precio</th>
                                                <th className="pb-2 font-medium text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.lines.map(line => (
                                                <tr key={line.id} className="border-b last:border-0">
                                                    <td className="py-1.5 pr-3 text-xs">
                                                        {line.product?.name ?? line.description ?? '—'}
                                                        {line.is_upsell && <Badge className="ml-2 text-[9px] border-blue-200 bg-blue-50 text-blue-600" variant="outline">Upsell</Badge>}
                                                    </td>
                                                    <td className="py-1.5 pr-3 text-right text-xs tabular-nums">{fmtNum(line.qty)}</td>
                                                    <td className="py-1.5 pr-3 text-right text-xs tabular-nums">{fmtNum(line.unit_price)}</td>
                                                    <td className="py-1.5 text-right text-xs tabular-nums font-medium">{fmtNum(line.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t">
                                                <td colSpan={3} className="pt-2 text-right text-xs text-muted-foreground">Subtotal</td>
                                                <td className="pt-2 text-right text-xs tabular-nums">{fmtNum(order.subtotal)}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={3} className="text-right text-xs text-muted-foreground">Impuesto</td>
                                                <td className="text-right text-xs tabular-nums">{fmtNum(order.tax_amount)}</td>
                                            </tr>
                                            <tr>
                                                <td colSpan={3} className="text-right text-sm font-semibold">Total</td>
                                                <td className="text-right text-sm font-bold tabular-nums">{fmtNum(order.total)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                )}
                            </CardContent>
                        </Card>

                        {/* ── Revisiones técnicas ─────────────────────────── */}
                        {order.status === 'completed' && (order.brake_fluid_pct || order.air_filter_status || order.cabin_filter_status || order.battery_voltage) && (
                            <Card>
                                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Wrench className="h-4 w-4" />Revisiones Adicionales</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                    {order.brake_fluid_pct && (
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Líquido de frenos</span>
                                            <span className={Number(order.brake_fluid_pct) > 3 ? 'text-red-600 font-medium' : 'text-green-600'}>
                                                {order.brake_fluid_pct}% humedad
                                            </span>
                                        </div>
                                    )}
                                    {order.air_filter_status && (
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Filtro de aire</span>
                                            <span className={FILTER_MAP[order.air_filter_status].color}>{FILTER_MAP[order.air_filter_status].label}</span>
                                        </div>
                                    )}
                                    {order.cabin_filter_status && (
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Filtro de cabina</span>
                                            <span className={FILTER_MAP[order.cabin_filter_status].color}>{FILTER_MAP[order.cabin_filter_status].label}</span>
                                        </div>
                                    )}
                                    {order.battery_voltage && (
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Batería</span>
                                            <span className={Number(order.battery_voltage) < 12.4 ? 'text-amber-600 font-medium' : 'text-green-600'}>
                                                {order.battery_voltage} V
                                            </span>
                                        </div>
                                    )}
                                    {order.checks_notes && (
                                        <div className="col-span-2">
                                            <span className="text-xs text-muted-foreground block">Notas</span>
                                            <p className="text-xs">{order.checks_notes}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* ── Sidebar derecha ─────────────────────────────────── */}
                    <div className="flex flex-col gap-6">

                        {/* Próximo cambio */}
                        {order.status === 'completed' && order.next_service_km && (
                            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                                <CardHeader><CardTitle className="text-sm flex items-center gap-2 text-green-800 dark:text-green-300"><Calendar className="h-4 w-4" />Próximo Servicio</CardTitle></CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-xs text-muted-foreground block">Kilometraje</span>
                                        <span className="text-lg font-bold tabular-nums text-green-800 dark:text-green-300">{fmtKm(order.next_service_km)}</span>
                                    </div>
                                    {order.next_service_date && (
                                        <div>
                                            <span className="text-xs text-muted-foreground block">Fecha estimada</span>
                                            <span className="font-medium">{fmtDate(order.next_service_date)}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* QR */}
                        {publicUrl && (
                            <Card>
                                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><QrCode className="h-4 w-4" />Etiqueta QR</CardTitle></CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-xs text-muted-foreground">El cliente puede escanear el QR del parabrisas para ver su historial.</p>
                                    <div className="flex justify-center">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicUrl)}`}
                                            alt="QR Code"
                                            className="rounded-lg border"
                                        />
                                    </div>
                                    <a href={publicUrl} target="_blank" rel="noreferrer" className="block text-center text-xs text-primary underline break-all">
                                        Ver historial público
                                    </a>
                                </CardContent>
                            </Card>
                        )}

                        {/* Historial del vehículo */}
                        {history.length > 0 && (
                            <Card>
                                <CardHeader><CardTitle className="text-sm">Historial del Vehículo</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {history.map(h => (
                                        <Link key={h.id} href={`/carservice/orders/${h.id}`} className="block rounded-lg border p-2 text-xs hover:bg-muted/40 transition">
                                            <div className="flex justify-between font-mono font-semibold">{h.reference}<span>{fmtNum(h.total)}</span></div>
                                            <div className="text-muted-foreground mt-0.5">
                                                {h.oil_type ? `${OIL_LABELS[h.oil_type] ?? h.oil_type} ${h.oil_viscosity ?? ''}` : '—'} · {fmtDate(h.completed_at)}
                                            </div>
                                            {h.next_service_km && <div className="text-green-600 mt-0.5">Próx: {fmtKm(h.next_service_km)}</div>}
                                        </Link>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {order.notes && (
                            <Card>
                                <CardHeader><CardTitle className="text-sm">Notas</CardTitle></CardHeader>
                                <CardContent><p className="text-xs text-muted-foreground">{order.notes}</p></CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

Show.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Lubricentro', href: '/carservice/orders' },
        { title: 'Orden' },
    ],
};
