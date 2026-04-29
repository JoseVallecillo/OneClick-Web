import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { Head, router, useForm } from '@inertiajs/react';
import { AlertCircle, Camera, Car, Check, ChevronsUpDown, Loader2, Pencil, Plus, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Customer { id: number; name: string; rtn: string | null }

interface VehicleInfo {
    id: number; plate: string; vin: string | null;
    make: string; model: string; year: number | null; color: string | null;
    engine: string | null; transmission: string | null; last_odometer: number;
    customer_id: number | null;
    customer: { id: number; name: string; rtn: string | null } | null;
    last_service: {
        reference: string; oil_type: string | null; oil_viscosity: string | null;
        odometer_out: number | null; completed_at: string | null;
        next_service_km: number | null; next_service_date: string | null;
    } | null;
}

interface Props {
    customers: Customer[];
    initialPlate: string;
    order?: {
        id: number; reference: string; vehicle_id: number; customer_id: number;
        odometer_in: number; inspection_notes: string | null; notes: string | null;
        photo_front: string | null; photo_side: string | null; photo_rear: string | null; photo_right: string | null;
        vehicle: VehicleInfo;
    };
}

const TRANSMISSIONS = [
    { value: 'manual', label: 'Manual' },
    { value: 'automatic', label: 'Automático' },
    { value: 'cvt', label: 'CVT' },
];

function fmtKm(n: number | null) { return n ? n.toLocaleString('es-HN') + ' km' : '—'; }

// ── Photo upload slot ──────────────────────────────────────────────────────────

function PhotoSlot({ label, existing, onChange }: { label: string; existing: string | null; onChange: (f: File | null) => void }) {
    const [preview, setPreview] = useState<string | null>(existing ? `/storage/${existing}` : null);
    const inputRef = useRef<HTMLInputElement>(null);

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] ?? null;
        if (file) {
            setPreview(URL.createObjectURL(file));
            onChange(file);
        }
    }

    function clear() { setPreview(null); onChange(null); if (inputRef.current) inputRef.current.value = ''; }

    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">{label}</Label>
            <div
                onClick={() => inputRef.current?.click()}
                className="relative flex h-28 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 transition hover:border-primary/40 hover:bg-muted/40"
            >
                {preview ? (
                    <>
                        <img src={preview} alt={label} className="h-full w-full rounded-lg object-cover" />
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); clear(); }}
                            className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Camera className="h-5 w-5" />
                        <span className="text-[10px]">Subir foto</span>
                    </div>
                )}
            </div>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CheckIn({ customers, initialPlate, order }: Props) {
    const isEdit = !!order;

    const { data, setData, post, processing, errors } = useForm<{
        // Service Order basic data
        vehicle_id: string;
        customer_id: string;
        odometer_in: string;
        inspection_notes: string;
        notes: string;

        // Visual Inspection (4 photos)
        photo_front: File | null;
        photo_side: File | null;
        photo_rear: File | null;
        photo_right: File | null;

        // Vehicle technical data (to be updated on check-in)
        plate: string;
        vin: string;
        make: string;
        model: string;
        year: string;
        color: string;
        engine: string;
        transmission: string;

        _method?: string;
    }>({
        vehicle_id:       order ? String(order.vehicle_id) : '',
        customer_id:      order ? String(order.customer_id) : '',
        odometer_in:      order ? String(order.odometer_in) : '',
        inspection_notes: order?.inspection_notes ?? '',
        notes:            order?.notes ?? '',

        photo_front: null,
        photo_side:  null,
        photo_rear:  null,
        photo_right: null,

        plate:  order?.vehicle?.plate  ?? initialPlate,
        vin:    order?.vehicle?.vin    ?? '',
        make:   order?.vehicle?.make   ?? '',
        model:  order?.vehicle?.model  ?? '',
        year:   order?.vehicle?.year ? String(order.vehicle.year) : '',
        color:  order?.vehicle?.color  ?? '',
        engine: order?.vehicle?.engine ?? '',
        transmission: order?.vehicle?.transmission ?? '',

        ...(isEdit ? { _method: 'PATCH' } : {}),
    });

    const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const customerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Plate lookup ─────────────────────────────────────────────────────────

    const [vehicle, setVehicle]         = useState<VehicleInfo | null>(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [plateSuggestions, setPlateSuggestions] = useState<any[]>([]);
    const plateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selectedCustomer = (vehicle?.customer as Customer | null) || customers.find(c => String(c.id) === data.customer_id);

    // Sync search input with selected customer name
    useEffect(() => {
        if (selectedCustomer && !customerSearchQuery) {
            setCustomerSearchQuery(selectedCustomer.name);
        }
    }, [selectedCustomer, customerSearchQuery]);

    const lookup = useCallback(async (p: string) => {
        if (!p || !p.trim()) return;
        setLookupLoading(true);
        try {
            const res = await fetch(`/carservice/vehicles/lookup?plate=${encodeURIComponent(p.trim().toUpperCase())}`);
            const json = await res.json();
            if (json.vehicle) {
                const v = json.vehicle as VehicleInfo;
                setVehicle(v);
                setData(prev => ({
                    ...prev,
                    vehicle_id:  String(v.id),
                    customer_id: v.customer ? String(v.customer.id) : prev.customer_id,
                    plate:       v.plate,
                    vin:         v.vin    ?? '',
                    make:        v.make,
                    model:       v.model,
                    year:        v.year ? String(v.year) : '',
                    color:       v.color  ?? '',
                    engine:      v.engine ?? '',
                    transmission: v.transmission ?? '',
                }));
            } else {
                setVehicle(null);
                setData(prev => ({
                    ...prev,
                    vehicle_id: '',
                    // Keep the plate they typed, but clear other fields
                    vin: '', make: '', model: '', year: '', color: '', engine: '', transmission: ''
                }));
            }
        } finally {
            setLookupLoading(false);
        }
    }, [setData]);

    const findPlates = useCallback(async (q: string) => {
        if (!q || q.length < 2) {
            setPlateSuggestions([]);
            return;
        }
        try {
            const res = await fetch(`/carservice/vehicles/lookup?query=${encodeURIComponent(q.trim().toUpperCase())}`);
            const json = await res.json();
            setPlateSuggestions(json.vehicles || []);
        } catch (e) {
            setPlateSuggestions([]);
        }
    }, []);

    useEffect(() => {
        if (plateDebounceRef.current) clearTimeout(plateDebounceRef.current);
        if (data.plate.length >= 2 && !vehicle) {
            plateDebounceRef.current = setTimeout(() => findPlates(data.plate), 300);
        } else {
            setPlateSuggestions([]);
        }
    }, [data.plate, findPlates, vehicle]);

    const findCustomers = useCallback(async (q: string) => {
        if (!q || q.length < 2) {
            setCustomerSuggestions([]);
            return;
        }
        try {
            const res = await fetch(`/carservice/customers/lookup?query=${encodeURIComponent(q.trim())}`);
            const json = await res.json();
            setCustomerSuggestions(json.customers || []);
        } catch (e) {
            setCustomerSuggestions([]);
        }
    }, []);

    useEffect(() => {
        if (customerDebounceRef.current) clearTimeout(customerDebounceRef.current);
        // Solo buscar si el query es diferente al nombre del cliente seleccionado
        if (customerSearchQuery.length >= 2 && (!selectedCustomer || customerSearchQuery !== selectedCustomer.name)) {
            customerDebounceRef.current = setTimeout(() => findCustomers(customerSearchQuery), 300);
        } else {
            setCustomerSuggestions([]);
        }
    }, [customerSearchQuery, findCustomers, selectedCustomer]);

    useEffect(() => {
        if (initialPlate && !isEdit) {
            lookup(initialPlate);
        }
    }, [initialPlate, isEdit, lookup]);


    // ── Submit ────────────────────────────────────────────────────────────────

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            post(`/carservice/orders/${order!.id}`, { forceFormData: true });
        } else {
            post('/carservice/orders', { forceFormData: true });
        }
    }


    return (
        <>
            <Head title={isEdit ? `Editar ${order!.reference}` : 'Nuevo Check-in de Vehículo'} />

            <form onSubmit={submit} className="flex flex-col gap-6 p-4 flex-1">

                {/* ── 1. Vehículo y Datos Básicos ────────────────────────── */}
                <Card>
                    <CardHeader className="pb-3 border-b mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Car className="h-5 w-5 text-primary" />
                                {isEdit ? `Orden ${order!.reference}` : 'Datos del Vehículo y Check-in'}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Seccion: Datos Técnicos */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                            <div className="space-y-1.5 flex flex-col">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Placa *</Label>
                                <div className="flex gap-1 relative">
                                    <div className="relative flex-1">
                                        <Input 
                                            value={data.plate} 
                                            onChange={e => {
                                                const val = e.target.value.toUpperCase();
                                                setData('plate', val);
                                                if (vehicle && vehicle.plate !== val) setVehicle(null);
                                            }} 
                                            className="font-mono uppercase h-9 w-full"
                                            placeholder="P-123456"
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), lookup(data.plate))}
                                            autoComplete="off"
                                        />
                                        
                                        {/* Sugerencias de placa */}
                                        {plateSuggestions.length > 0 && !vehicle && (
                                            <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-popover border rounded-md shadow-lg p-1">
                                                {plateSuggestions.map(p => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setData('plate', p.plate);
                                                            lookup(p.plate);
                                                            setPlateSuggestions([]);
                                                        }}
                                                        className="w-full text-left px-3 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground flex flex-col"
                                                    >
                                                        <span className="font-bold font-mono">{p.plate}</span>
                                                        <span className="text-[10px] text-muted-foreground">{p.make} {p.model}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {!isEdit && (
                                        <Button 
                                            type="button" 
                                            size="sm" 
                                            className="h-9 w-9 p-0" 
                                            variant="outline"
                                            onClick={() => lookup(data.plate)}
                                            disabled={lookupLoading}
                                        >
                                            {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                        </Button>
                                    )}
                                </div>
                                {errors.plate && <p className="text-[10px] text-destructive">{errors.plate}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Chasis (VIN)</Label>
                                <Input value={data.vin} onChange={e => setData('vin', e.target.value.toUpperCase())} className="font-mono uppercase h-9" />
                                {errors.vin && <p className="text-[10px] text-destructive">{errors.vin}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Marca *</Label>
                                <Input value={data.make} onChange={e => setData('make', e.target.value)} className="h-9" />
                                {errors.make && <p className="text-[10px] text-destructive">{errors.make}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Modelo *</Label>
                                <Input value={data.model} onChange={e => setData('model', e.target.value)} className="h-9" />
                                {errors.model && <p className="text-[10px] text-destructive">{errors.model}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Año</Label>
                                <Input type="number" value={data.year} onChange={e => setData('year', e.target.value)} className="h-9" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Color</Label>
                                <Input value={data.color} onChange={e => setData('color', e.target.value)} className="h-9" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Motor</Label>
                                <Input value={data.engine} onChange={e => setData('engine', e.target.value)} className="h-9" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">Transmisión</Label>
                                <Select value={data.transmission} onValueChange={v => setData('transmission', v)}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                    <SelectContent>
                                        {TRANSMISSIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Separador sutil */}
                        <div className="h-px bg-muted" />

                        {/* Seccion: Datos de Check-in (Cliente y Odometro) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-end">
                            <div className="space-y-1.5 min-w-0">
                                <Label className="text-xs uppercase font-bold text-primary">Dueño / Cliente *</Label>
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
                                            className="h-10 border-primary/30 pr-10"
                                            autoComplete="off"
                                        />
                                        {customerSearchQuery ? (
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
                                        
                                        {/* Resultados de búsqueda de clientes */}
                                        {customerSuggestions.length > 0 && (
                                            <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-popover border rounded-md shadow-lg p-1">
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
                                                        {c.rtn && <span className="text-[10px] text-muted-foreground">RTN: {c.rtn}</span>}
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
                                                {selectedCustomer.rtn && ` (RTN: ${selectedCustomer.rtn})`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {errors.customer_id && <p className="text-[10px] text-destructive">{errors.customer_id}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs uppercase font-bold text-primary">Odómetro de Entrada (km) *</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={data.odometer_in}
                                        onChange={e => setData('odometer_in', e.target.value)}
                                        placeholder="Ej. 85000"
                                        className="h-10 font-mono border-primary/30"
                                    />
                                    {vehicle && vehicle.last_odometer > 0 && (
                                        <p className="mt-1 text-[10px] text-muted-foreground italic">Último: {fmtKm(vehicle.last_odometer)}</p>
                                    )}
                                </div>
                                {errors.odometer_in && <p className="text-[10px] text-destructive">{errors.odometer_in}</p>}
                            </div>
                        </div>

                        {/* Alerta de historial si existe */}
                        {vehicle?.last_service && (
                            <Alert className="py-2.5 bg-muted/50 border-none">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    Historial: <strong>{vehicle.last_service.reference}</strong> ({vehicle.last_service.completed_at}) — {vehicle.last_service.oil_type} {vehicle.last_service.oil_viscosity} — Próximo: <strong>{fmtKm(vehicle.last_service.next_service_km)}</strong>
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* ── 2. Inspección Visual (4 Fotos) ──────────────────────── */}
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Camera className="h-4 w-4" />Inspección Visual</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <PhotoSlot label="Frontal" existing={order?.photo_front ?? null} onChange={f => setData('photo_front', f)} />
                            <PhotoSlot label="C. Izquierdo" existing={order?.photo_side ?? null}  onChange={f => setData('photo_side', f)} />
                            <PhotoSlot label="C. Derecho"   existing={order?.photo_right ?? null} onChange={f => setData('photo_right', f)} />
                            <PhotoSlot label="Trasero"  existing={order?.photo_rear ?? null}  onChange={f => setData('photo_rear', f)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold">Notas de inspección (rayones, golpes, etc.)</Label>
                            <Textarea value={data.inspection_notes} onChange={e => setData('inspection_notes', e.target.value)} rows={2} placeholder="Describa el estado visual del vehículo..." />
                        </div>
                    </CardContent>
                </Card>

                {/* ── 3. Notas y Guardar ──────────────────────────────────── */}
                <Card>
                    <CardContent className="pt-4 space-y-4">
                        <div className="space-y-1.5">
                            <Label>Notas internas / Observaciones generales</Label>
                            <Textarea value={data.notes} onChange={e => setData('notes', e.target.value)} rows={2} />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => history.back()}>Cancelar</Button>
                            <Button type="submit" disabled={processing} className="px-8">
                                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? 'Actualizar Datos' : 'Registrar Check-in'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

            </form>
        </>
    );
}

CheckIn.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Lubricentro', href: '/carservice/orders' },
        { title: 'Check-in' },
    ],
};
