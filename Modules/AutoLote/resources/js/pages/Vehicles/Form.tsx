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
import { ArrowLeft, Check, Loader2, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Contact { id: number; name: string }

interface ExistingVehicle {
    id: number;
    vin: string | null;
    placa: string | null;
    motor: string | null;
    marca: string;
    modelo: string;
    anio: number;
    color: string | null;
    transmision: string;
    kilometraje: number;
    num_duenos_anteriores: number;
    gravamen: boolean;
    estado_aduana: string;
    precio_compra: string;
    vendedor_id: number | null;
    notas: string | null;
    received_at: string;
}

interface Props {
    vehicle?: ExistingVehicle;
    contacts: Contact[];
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function VehicleForm({ vehicle, contacts }: Props) {
    const isEditing = !!vehicle;

    const { data, setData, post, patch, processing, errors } = useForm({
        vin:                   vehicle?.vin ?? '',
        placa:                 vehicle?.placa ?? '',
        motor:                 vehicle?.motor ?? '',
        marca:                 vehicle?.marca ?? '',
        modelo:                vehicle?.modelo ?? '',
        anio:                  vehicle ? String(vehicle.anio) : String(new Date().getFullYear()),
        color:                 vehicle?.color ?? '',
        transmision:           vehicle?.transmision ?? 'manual',
        kilometraje:           vehicle ? String(vehicle.kilometraje) : '0',
        num_duenos_anteriores: vehicle ? String(vehicle.num_duenos_anteriores) : '0',
        gravamen:              vehicle?.gravamen ?? false,
        estado_aduana:         vehicle?.estado_aduana ?? 'nacional',
        precio_compra:         vehicle?.precio_compra ?? '0',
        vendedor_id:           vehicle?.vendedor_id ? String(vehicle.vendedor_id) : '',
        notas:                 vehicle?.notas ?? '',
        received_at:           vehicle?.received_at ?? new Date().toISOString().slice(0, 10),
    });

    // Vendor contact lookup
    const [vendorSearch, setVendorSearch]         = useState('');
    const [vendorSuggestions, setVendorSuggestions] = useState<Contact[]>([]);
    const [vendorLoading, setVendorLoading]         = useState(false);
    const vendorDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selectedVendor = contacts.find(c => String(c.id) === data.vendedor_id);

    useEffect(() => {
        if (selectedVendor && !vendorSearch) {
            setVendorSearch(selectedVendor.name);
        }
    }, [selectedVendor, vendorSearch]);

    const findVendors = useCallback(async (q: string) => {
        if (!q || q.length < 2) {
            setVendorSuggestions([]);
            return;
        }
        setVendorLoading(true);
        try {
            const res  = await fetch(`/contacts/lookup?query=${encodeURIComponent(q.trim())}`);
            const json = await res.json();
            setVendorSuggestions(json.contacts || []);
        } finally {
            setVendorLoading(false);
        }
    }, []);

    useEffect(() => {
        if (vendorDebounceRef.current) clearTimeout(vendorDebounceRef.current);
        if (vendorSearch.length >= 2 && (!selectedVendor || vendorSearch !== selectedVendor.name)) {
            vendorDebounceRef.current = setTimeout(() => findVendors(vendorSearch), 300);
        } else if (!vendorSearch) {
            setVendorSuggestions([]);
        }
    }, [vendorSearch, findVendors, selectedVendor]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEditing) {
            patch(`/autolote/vehicles/${vehicle!.id}`);
        } else {
            post('/autolote/vehicles');
        }
    }

    const pageTitle = isEditing ? `Editar Vehículo` : 'Registrar Vehículo';

    return (
        <>
            <Head title={`Autolote — ${pageTitle}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">

                {/* Back + title */}
                <div className="flex items-center gap-3">
                    <Link href={isEditing ? `/autolote/vehicles/${vehicle!.id}` : '/autolote/vehicles'}>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            {isEditing ? 'Vehículo' : 'Inventario'}
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">{pageTitle}</h1>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6">

                    {/* ── Identification ── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Identificación</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <Label>VIN / Chasis</Label>
                                <Input
                                    value={data.vin}
                                    onChange={e => setData('vin', e.target.value)}
                                    placeholder="Ej: 1HGBH41JXMN109186"
                                    className="font-mono"
                                />
                                {errors.vin && <p className="text-xs text-destructive">{errors.vin}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Placa</Label>
                                <Input
                                    value={data.placa}
                                    onChange={e => setData('placa', e.target.value.toUpperCase())}
                                    placeholder="Ej: ABC-1234"
                                    className="font-mono"
                                />
                                {errors.placa && <p className="text-xs text-destructive">{errors.placa}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Número de Motor</Label>
                                <Input
                                    value={data.motor}
                                    onChange={e => setData('motor', e.target.value)}
                                    placeholder="Ej: K24A2-1234567"
                                    className="font-mono"
                                />
                                {errors.motor && <p className="text-xs text-destructive">{errors.motor}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Specifications ── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Especificaciones</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <Label>Marca <span className="text-destructive">*</span></Label>
                                <Input
                                    value={data.marca}
                                    onChange={e => setData('marca', e.target.value)}
                                    placeholder="Ej: Toyota"
                                />
                                {errors.marca && <p className="text-xs text-destructive">{errors.marca}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Modelo <span className="text-destructive">*</span></Label>
                                <Input
                                    value={data.modelo}
                                    onChange={e => setData('modelo', e.target.value)}
                                    placeholder="Ej: Corolla"
                                />
                                {errors.modelo && <p className="text-xs text-destructive">{errors.modelo}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Año <span className="text-destructive">*</span></Label>
                                <Input
                                    type="number"
                                    min="1900"
                                    max={new Date().getFullYear() + 2}
                                    value={data.anio}
                                    onChange={e => setData('anio', e.target.value)}
                                />
                                {errors.anio && <p className="text-xs text-destructive">{errors.anio}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Color</Label>
                                <Input
                                    value={data.color}
                                    onChange={e => setData('color', e.target.value)}
                                    placeholder="Ej: Blanco perla"
                                />
                                {errors.color && <p className="text-xs text-destructive">{errors.color}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Transmisión <span className="text-destructive">*</span></Label>
                                <Select value={data.transmision} onValueChange={v => setData('transmision', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">Manual</SelectItem>
                                        <SelectItem value="automatica">Automática</SelectItem>
                                        <SelectItem value="cvt">CVT</SelectItem>
                                        <SelectItem value="otro">Otro</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.transmision && <p className="text-xs text-destructive">{errors.transmision}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Kilometraje <span className="text-destructive">*</span></Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={data.kilometraje}
                                    onChange={e => setData('kilometraje', e.target.value)}
                                />
                                {errors.kilometraje && <p className="text-xs text-destructive">{errors.kilometraje}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Legal status ── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Estado Legal</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <Label>Dueños anteriores <span className="text-destructive">*</span></Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={data.num_duenos_anteriores}
                                    onChange={e => setData('num_duenos_anteriores', e.target.value)}
                                />
                                {errors.num_duenos_anteriores && <p className="text-xs text-destructive">{errors.num_duenos_anteriores}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Estado de Aduana <span className="text-destructive">*</span></Label>
                                <Select value={data.estado_aduana} onValueChange={v => setData('estado_aduana', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="nacional">Nacional</SelectItem>
                                        <SelectItem value="en_tramite">En Trámite</SelectItem>
                                        <SelectItem value="importado">Importado (Limpio)</SelectItem>
                                        <SelectItem value="exonerado">Exonerado</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.estado_aduana && <p className="text-xs text-destructive">{errors.estado_aduana}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Gravamen / Embargo</Label>
                                <div className="flex items-center gap-3 h-10">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.gravamen}
                                            onChange={e => setData('gravamen', e.target.checked)}
                                            className="h-4 w-4 rounded border-input"
                                        />
                                        <span className="text-sm">Tiene gravamen o embargo activo</span>
                                    </label>
                                </div>
                                {errors.gravamen && <p className="text-xs text-destructive">{errors.gravamen}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Cost & acquisition ── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Adquisición</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <Label>Precio de Compra <span className="text-destructive">*</span></Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.precio_compra}
                                    onChange={e => setData('precio_compra', e.target.value)}
                                />
                                {errors.precio_compra && <p className="text-xs text-destructive">{errors.precio_compra}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Fecha de Recepción <span className="text-destructive">*</span></Label>
                                <Input
                                    type="date"
                                    value={data.received_at}
                                    onChange={e => setData('received_at', e.target.value)}
                                />
                                {errors.received_at && <p className="text-xs text-destructive">{errors.received_at}</p>}
                            </div>

                            {/* Vendor lookup */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Proveedor / Vendedor</Label>
                                <div className="relative">
                                    <div className="relative">
                                        <Input
                                            placeholder="Buscar contacto..."
                                            value={vendorSearch}
                                            onChange={e => {
                                                setVendorSearch(e.target.value);
                                                if (selectedVendor && e.target.value !== selectedVendor.name) {
                                                    setData('vendedor_id', '');
                                                }
                                            }}
                                            className="h-10 pr-10"
                                            autoComplete="off"
                                        />
                                        {vendorLoading ? (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                        ) : vendorSearch ? (
                                            <button
                                                type="button"
                                                onClick={() => { setVendorSearch(''); setData('vendedor_id', ''); }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        )}

                                        {vendorSuggestions.length > 0 && (
                                            <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-popover border rounded-md shadow-lg p-1">
                                                {vendorSuggestions.map(c => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setData('vendedor_id', String(c.id));
                                                            setVendorSearch(c.name);
                                                            setVendorSuggestions([]);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                                                    >
                                                        {c.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {selectedVendor && (
                                        <div className="mt-1 flex items-center gap-1.5 px-1">
                                            <Check className="h-3 w-3 text-green-600" />
                                            <span className="text-[10px] text-muted-foreground">
                                                Seleccionado: <strong>{selectedVendor.name}</strong>
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {errors.vendedor_id && <p className="text-xs text-destructive">{errors.vendedor_id}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Notes ── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Notas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={data.notas}
                                onChange={e => setData('notas', e.target.value)}
                                rows={3}
                                placeholder="Observaciones, historial, detalles de adquisición..."
                            />
                            {errors.notas && <p className="text-xs text-destructive">{errors.notas}</p>}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(isEditing ? `/autolote/vehicles/${vehicle!.id}` : '/autolote/vehicles')}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEditing ? 'Guardar cambios' : 'Registrar vehículo'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

VehicleForm.layout = (page: React.ReactNode) => ({
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Autolote', href: '/autolote/vehicles' },
        { title: 'Vehículo', href: '#' },
    ],
    children: page,
});
