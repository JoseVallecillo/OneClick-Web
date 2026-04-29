import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { Head, useForm } from '@inertiajs/react';
import { Battery, Calendar, History as HistoryIcon, Loader2, Plus, Trash2, Wind } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
function fmtNum(v: string | number) {
    return Number(v).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-HN', { year: 'numeric', month: 'short', day: '2-digit' });
}

interface ServiceOrder {
    id: number; reference: string; odometer_in: number;
    oil_type: string | null; oil_viscosity: string | null;
    vehicle: { plate: string; make: string; model: string; year: number | null };
    customer: { name: string };
    service_package: { name: string } | null;
    lines: { id: number; description: string | null; total: string; product: { name: string } | null }[];
}

interface ExtraLine { product_id: string; warehouse_id: string; description: string; qty: string; unit_price: string; tax_rate: string; upsell_type: string }
interface HistoryRow {
    id: number; reference: string; oil_type: string | null; oil_viscosity: string | null;
    odometer_out: number | null; completed_at: string | null; next_service_km: number | null; total: string;
}

const OIL_INTERVALS: Record<string, number> = { mineral: 5000, semi_synthetic: 7500, synthetic: 10000 };
const OIL_LABELS: Record<string, string>    = { mineral: 'Mineral', semi_synthetic: 'Semi-Sintético', synthetic: 'Sintético 100%' };

const FILTER_OPTIONS = [
    { value: 'good',    label: 'Bueno' },
    { value: 'dirty',   label: 'Sucio — recomendar cambio' },
    { value: 'replace', label: 'Reemplazar ahora' },
];

const UPSELL_TYPES = [
    { value: 'brake_fluid',   label: 'Líquido de frenos' },
    { value: 'air_filter',    label: 'Filtro de aire' },
    { value: 'cabin_filter',  label: 'Filtro de cabina' },
    { value: 'battery',       label: 'Batería' },
    { value: 'other',         label: 'Otro' },
];

function fmtKm(n: number) { return n.toLocaleString('es-HN') + ' km'; }

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Complete({ order, history, warehouses }: { order: ServiceOrder; history: HistoryRow[]; warehouses: { id: number; name: string }[] }) {
    const { data, setData, post, processing, errors } = useForm<{
        odometer_out: string;
        brake_fluid_pct: string;
        air_filter_status: string;
        cabin_filter_status: string;
        battery_voltage: string;
        checks_notes: string;
        notes: string;
        extra_lines: ExtraLine[];
    }>({
        odometer_out:        String(order.odometer_in),
        brake_fluid_pct:     '',
        air_filter_status:   '',
        cabin_filter_status: '',
        battery_voltage:     '',
        checks_notes:        '',
        notes:               '',
        extra_lines:         [],
    });

    // ── Next service preview ──────────────────────────────────────────────────
    const odomOut  = parseInt(data.odometer_out || '0', 10);
    const interval = OIL_INTERVALS[order.oil_type ?? 'mineral'] ?? 5000;
    const nextKm   = odomOut > 0 ? odomOut + interval : null;

    // ── Extra lines ───────────────────────────────────────────────────────────
    function addExtra() {
        setData('extra_lines', [...data.extra_lines, { 
            product_id: '', 
            warehouse_id: warehouses.length === 1 ? String(warehouses[0].id) : '',
            description: '', 
            qty: '1', 
            unit_price: '0', 
            tax_rate: '0', 
            upsell_type: 'other' 
        }]);
    }
    function removeExtra(i: number) { setData('extra_lines', data.extra_lines.filter((_, idx) => idx !== i)); }
    function setExtra(i: number, field: keyof ExtraLine, value: string) {
        const updated = [...data.extra_lines];
        updated[i] = { ...updated[i], [field]: value };
        setData('extra_lines', updated);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/carservice/orders/${order.id}/complete`);
    }

    return (
        <>
            <Head title={`Completar ${order.reference}`} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
                <form onSubmit={submit} className="lg:col-span-2 flex flex-col gap-6">

                {/* ── Header resumen ──────────────────────────────────────── */}
                <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardContent className="pt-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="font-mono font-bold text-lg">{order.reference}</p>
                                <p className="text-sm text-muted-foreground">
                                    {order.vehicle.make} {order.vehicle.model} {order.vehicle.year ?? ''} —
                                    <span className="font-mono ml-1">{order.vehicle.plate}</span> · {order.customer.name}
                                </p>
                            </div>
                            <div className="text-right text-sm">
                                <p className="text-muted-foreground text-xs">Aceite</p>
                                <p className="font-medium">{order.oil_type ? `${OIL_LABELS[order.oil_type]} ${order.oil_viscosity ?? ''}` : '—'}</p>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {order.lines.map(l => (
                                <Badge key={l.id} variant="outline" className="text-xs">{l.product?.name ?? l.description ?? '—'}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ── Odómetro de salida ──────────────────────────────────── */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Odómetro de Salida</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
                        <div className="space-y-1">
                            <Label>Km de salida *</Label>
                            <Input
                                type="number" min={order.odometer_in}
                                value={data.odometer_out}
                                onChange={e => setData('odometer_out', e.target.value)}
                                className="font-mono text-lg"
                                placeholder={String(order.odometer_in)}
                            />
                            {errors.odometer_out && <p className="text-xs text-red-600">{errors.odometer_out}</p>}
                            <p className="text-xs text-muted-foreground">Entrada: {fmtKm(order.odometer_in)}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Intervalo ({order.oil_type ? OIL_LABELS[order.oil_type] : '—'})</Label>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-400">+{fmtKm(interval)}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Próximo cambio en</Label>
                            <p className="text-2xl font-bold tabular-nums">{nextKm ? fmtKm(nextKm) : '—'}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Revisiones técnicas (upselling) ────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Revisiones Técnicas</CardTitle>
                        <p className="text-xs text-muted-foreground">Registra el estado de los consumibles. Los que requieran atención generarán oportunidades de upselling.</p>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                        {/* Líquido de frenos */}
                        <div className="space-y-1 rounded-lg border p-3">
                            <Label className="text-xs font-semibold flex items-center gap-1.5">Líquido de frenos — Humedad %</Label>
                            <Input
                                type="number" min="0" max="100" step="0.1"
                                value={data.brake_fluid_pct}
                                onChange={e => setData('brake_fluid_pct', e.target.value)}
                                placeholder="Ej. 2.5"
                                className="font-mono"
                            />
                            {data.brake_fluid_pct && Number(data.brake_fluid_pct) > 3 && (
                                <p className="text-xs text-red-600 font-medium">⚠ Supera 3% — recomendar cambio</p>
                            )}
                        </div>

                        {/* Batería */}
                        <div className="space-y-1 rounded-lg border p-3">
                            <Label className="text-xs font-semibold flex items-center gap-1.5"><Battery className="h-3.5 w-3.5" />Batería — Voltaje</Label>
                            <Input
                                type="number" min="0" max="20" step="0.01"
                                value={data.battery_voltage}
                                onChange={e => setData('battery_voltage', e.target.value)}
                                placeholder="Ej. 12.6 V"
                                className="font-mono"
                            />
                            {data.battery_voltage && Number(data.battery_voltage) < 12.4 && (
                                <p className="text-xs text-amber-600 font-medium">⚠ Voltaje bajo — revisar carga</p>
                            )}
                        </div>

                        {/* Filtro de aire */}
                        <div className="space-y-1 rounded-lg border p-3">
                            <Label className="text-xs font-semibold flex items-center gap-1.5"><Wind className="h-3.5 w-3.5" />Filtro de Aire</Label>
                            <Select value={data.air_filter_status} onValueChange={v => setData('air_filter_status', v)}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar estado…" /></SelectTrigger>
                                <SelectContent>{FILTER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>

                        {/* Filtro de cabina */}
                        <div className="space-y-1 rounded-lg border p-3">
                            <Label className="text-xs font-semibold flex items-center gap-1.5"><Wind className="h-3.5 w-3.5" />Filtro de Cabina</Label>
                            <Select value={data.cabin_filter_status} onValueChange={v => setData('cabin_filter_status', v)}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar estado…" /></SelectTrigger>
                                <SelectContent>{FILTER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-full space-y-1">
                            <Label className="text-xs">Notas de revisión</Label>
                            <Textarea value={data.checks_notes} onChange={e => setData('checks_notes', e.target.value)} rows={2} />
                        </div>
                    </CardContent>
                </Card>

                {/* ── Servicios adicionales ───────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Servicios Adicionales</CardTitle>
                        <p className="text-xs text-muted-foreground">Agrega productos o servicios realizados durante la revisión (filtros cambiados, batería, etc.).</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {data.extra_lines.map((line, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 items-end rounded-lg border p-2">
                                <div className="col-span-3 space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Descripción</Label>
                                    <Input value={line.description} onChange={e => setExtra(i, 'description', e.target.value)} placeholder="Nombre del servicio" className="h-8 text-xs" />
                                </div>
                                <div className="col-span-1 space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Cant.</Label>
                                    <Input type="number" min="0.01" step="0.01" value={line.qty} onChange={e => setExtra(i, 'qty', e.target.value)} className="h-8 text-xs font-mono text-right" />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Precio</Label>
                                    <Input type="number" min="0" step="0.01" value={line.unit_price} onChange={e => setExtra(i, 'unit_price', e.target.value)} className="h-8 text-xs font-mono text-right" />
                                </div>
                                <div className="col-span-3 space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Almacén</Label>
                                    <Select value={line.warehouse_id} onValueChange={v => setExtra(i, 'warehouse_id', v)}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Almacén…" /></SelectTrigger>
                                        <SelectContent>{warehouses.map((w: { id: number; name: string }) => <SelectItem key={w.id} value={String(w.id)} className="text-xs">{w.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo</Label>
                                    <Select value={line.upsell_type} onValueChange={v => setExtra(i, 'upsell_type', v)}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>{UPSELL_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500" onClick={() => removeExtra(i)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addExtra} className="gap-1.5">
                            <Plus className="h-3.5 w-3.5" /> Agregar servicio adicional
                        </Button>
                    </CardContent>
                </Card>

                {/* ── Notas y submit ──────────────────────────────────────── */}
                <Card>
                    <CardContent className="pt-4 space-y-4">
                        <div className="space-y-1">
                            <Label>Notas finales</Label>
                            <Textarea value={data.notes} onChange={e => setData('notes', e.target.value)} rows={2} />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>Volver</Button>
                            <Button type="submit" disabled={processing} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                                {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                                Finalizar y Marcar como Realizado
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                </form>

                {/* ── Sidebar Historial ─────────────────────────────────── */}
                <div className="flex flex-col gap-6">
                    <Card className="border-blue-100 bg-blue-50/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <HistoryIcon className="h-4 w-4 text-blue-500" />
                                Historial del Vehículo
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Últimos servicios realizados</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {history.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4 italic">No hay servicios anteriores registrados.</p>
                            ) : (
                                history.map(h => (
                                    <div key={h.id} className="rounded-lg border bg-white p-2.5 shadow-sm text-xs space-y-1.5">
                                        <div className="flex justify-between items-start">
                                            <span className="font-mono font-bold text-blue-700">{h.reference}</span>
                                            <span className="font-semibold tabular-nums">L. {fmtNum(h.total)}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-x-2 text-muted-foreground">
                                            <span>{h.oil_type ? `${OIL_LABELS[h.oil_type] ?? h.oil_type} ${h.oil_viscosity ?? ''}` : '—'}</span>
                                            <span>·</span>
                                            <span>{fmtDate(h.completed_at)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-muted-foreground">Odómetro:</span>
                                            <span className="font-medium tabular-nums">{h.odometer_out ? h.odometer_out.toLocaleString('es-HN') : '—'} km</span>
                                        </div>
                                        {h.next_service_km && (
                                            <div className="flex items-center gap-1.5 pt-1 border-t border-dashed mt-1 content-center">
                                                <Calendar className="h-3 w-3 text-green-600" />
                                                <span className="text-[10px] text-green-700 font-medium">Próximo: {h.next_service_km.toLocaleString('es-HN')} km</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground uppercase tracking-widest">Resumen Técnico Actual</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="p-2 rounded bg-muted/30 border border-dashed">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Paquete Contratado</p>
                                <p className="font-semibold">{order.service_package?.name ?? 'Personalizado'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 rounded bg-muted/20">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Entrada</p>
                                    <p className="font-mono font-bold text-lg">{order.odometer_in.toLocaleString('es-HN')}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">KM</p>
                                </div>
                                <div className="p-2 rounded bg-muted/20">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Salida</p>
                                    <p className="font-mono font-bold text-lg">{data.odometer_out || '—'}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">KM</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

Complete.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Lubricentro', href: '/carservice/orders' },
        { title: 'Completar Servicio' },
    ],
};
