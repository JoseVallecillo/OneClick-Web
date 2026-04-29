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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Contact { id: number; name: string }

interface VehicleOption {
    id: number;
    marca: string;
    modelo: string;
    anio: number;
    placa: string | null;
}

interface Vehicle {
    id: number;
    marca: string;
    modelo: string;
    anio: number;
    placa: string | null;
    vin: string | null;
    color: string | null;
    kilometraje: number;
    precio_compra: string;
    costo_total: string;
}

interface Props {
    vehicle: Vehicle;
    contacts: Contact[];
    disponibles_permuta: VehicleOption[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtNum(n: number) {
    return n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcMonthlyPayment(principal: number, annualRate: number, months: number): number {
    if (months <= 0) return 0;
    if (annualRate <= 0) return principal / months;
    const r = annualRate / 100 / 12;
    return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SaleForm({ vehicle, contacts, disponibles_permuta }: Props) {

    const { data, setData, post, processing, errors } = useForm({
        buyer_id:            '',
        precio_venta:        '',
        descuento:           '0',
        tipo_pago:           'contado',
        vehicle_permuta_id:  '',
        valor_permuta:       '0',
        fecha_venta:         new Date().toISOString().slice(0, 10),
        notas:               '',
        loan: {
            monto_prestamo: '',
            tasa_interes:   '',
            plazo_meses:    '',
            fecha_inicio:   new Date().toISOString().slice(0, 10),
        },
    });

    // Buyer lookup
    const [buyerSearch, setBuyerSearch]         = useState('');
    const [buyerSuggestions, setBuyerSuggestions] = useState<Contact[]>([]);
    const [buyerLoading, setBuyerLoading]         = useState(false);
    const buyerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const selectedBuyer = contacts.find(c => String(c.id) === data.buyer_id);

    useEffect(() => {
        if (selectedBuyer && !buyerSearch) setBuyerSearch(selectedBuyer.name);
    }, [selectedBuyer, buyerSearch]);

    const findBuyers = useCallback(async (q: string) => {
        if (!q || q.length < 2) { setBuyerSuggestions([]); return; }
        setBuyerLoading(true);
        try {
            const res  = await fetch(`/contacts/lookup?query=${encodeURIComponent(q.trim())}`);
            const json = await res.json();
            setBuyerSuggestions(json.contacts || []);
        } finally {
            setBuyerLoading(false);
        }
    }, []);

    useEffect(() => {
        if (buyerDebounceRef.current) clearTimeout(buyerDebounceRef.current);
        if (buyerSearch.length >= 2 && (!selectedBuyer || buyerSearch !== selectedBuyer.name)) {
            buyerDebounceRef.current = setTimeout(() => findBuyers(buyerSearch), 300);
        } else if (!buyerSearch) {
            setBuyerSuggestions([]);
        }
    }, [buyerSearch, findBuyers, selectedBuyer]);

    // Loan preview
    const loanPreview = useMemo(() => {
        if (data.tipo_pago !== 'credito_propio') return null;
        const p = Number(data.loan.monto_prestamo);
        const r = Number(data.loan.tasa_interes);
        const n = Number(data.loan.plazo_meses);
        if (!p || !n) return null;
        const cuota = calcMonthlyPayment(p, r, n);
        return { cuota, totalPagado: cuota * n, totalInteres: cuota * n - p };
    }, [data.tipo_pago, data.loan.monto_prestamo, data.loan.tasa_interes, data.loan.plazo_meses]);

    // Net price
    const netPrice = useMemo(() => {
        return Math.max(0,
            Number(data.precio_venta || 0)
            - Number(data.descuento || 0)
            - Number(data.valor_permuta || 0)
        );
    }, [data.precio_venta, data.descuento, data.valor_permuta]);

    const profit = netPrice - Number(vehicle.costo_total);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/autolote/vehicles/${vehicle.id}/sell`);
    }

    return (
        <>
            <Head title={`Registrar Venta — ${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href={`/autolote/vehicles/${vehicle.id}`}>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            Vehículo
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">Registrar Venta</h1>
                </div>

                {/* Vehicle info (read-only) */}
                <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                    <CardContent className="pt-4">
                        <div className="flex flex-wrap gap-6 text-sm">
                            <div>
                                <span className="text-muted-foreground">Vehículo: </span>
                                <strong>{vehicle.marca} {vehicle.modelo} {vehicle.anio}</strong>
                                {vehicle.color && <span className="text-muted-foreground"> — {vehicle.color}</span>}
                            </div>
                            {vehicle.placa && (
                                <div>
                                    <span className="text-muted-foreground">Placa: </span>
                                    <strong className="font-mono">{vehicle.placa}</strong>
                                </div>
                            )}
                            <div>
                                <span className="text-muted-foreground">Km: </span>
                                <strong>{vehicle.kilometraje.toLocaleString()}</strong>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Costo Total: </span>
                                <strong>{fmtNum(Number(vehicle.costo_total))}</strong>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={submit} className="flex flex-col gap-6">

                    {/* ── Buyer ── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Comprador</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-1.5 max-w-sm">
                                <Label>Comprador <span className="text-destructive">*</span></Label>
                                <div className="relative">
                                    <Input
                                        placeholder="Buscar por nombre o RTN..."
                                        value={buyerSearch}
                                        onChange={e => {
                                            setBuyerSearch(e.target.value);
                                            if (selectedBuyer && e.target.value !== selectedBuyer.name) {
                                                setData('buyer_id', '');
                                            }
                                        }}
                                        className="h-10 pr-10"
                                        autoComplete="off"
                                    />
                                    {buyerLoading ? (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                    ) : buyerSearch ? (
                                        <button
                                            type="button"
                                            onClick={() => { setBuyerSearch(''); setData('buyer_id', ''); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    )}
                                    {buyerSuggestions.length > 0 && (
                                        <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-popover border rounded-md shadow-lg p-1">
                                            {buyerSuggestions.map(c => (
                                                <button
                                                    key={c.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setData('buyer_id', String(c.id));
                                                        setBuyerSearch(c.name);
                                                        setBuyerSuggestions([]);
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                                                >
                                                    {c.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {selectedBuyer && (
                                    <div className="flex items-center gap-1.5 px-1">
                                        <Check className="h-3 w-3 text-green-600" />
                                        <span className="text-[10px] text-muted-foreground">
                                            Seleccionado: <strong>{selectedBuyer.name}</strong>
                                        </span>
                                    </div>
                                )}
                                {errors.buyer_id && <p className="text-xs text-destructive">{errors.buyer_id}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Pricing ── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Precio y Forma de Pago</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <Label>Precio de Venta <span className="text-destructive">*</span></Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.precio_venta}
                                    onChange={e => setData('precio_venta', e.target.value)}
                                />
                                {errors.precio_venta && <p className="text-xs text-destructive">{errors.precio_venta}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Descuento</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.descuento}
                                    onChange={e => setData('descuento', e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Forma de Pago <span className="text-destructive">*</span></Label>
                                <Select value={data.tipo_pago} onValueChange={v => setData('tipo_pago', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="contado">Contado</SelectItem>
                                        <SelectItem value="credito_propio">Crédito Propio</SelectItem>
                                        <SelectItem value="financiamiento_externo">Financiamiento Externo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Fecha de Venta <span className="text-destructive">*</span></Label>
                                <Input
                                    type="date"
                                    value={data.fecha_venta}
                                    onChange={e => setData('fecha_venta', e.target.value)}
                                />
                                {errors.fecha_venta && <p className="text-xs text-destructive">{errors.fecha_venta}</p>}
                            </div>

                            {/* Net price preview */}
                            {Number(data.precio_venta) > 0 && (
                                <div className="sm:col-span-2 lg:col-span-3 rounded-md border bg-muted/30 p-3 grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-xs text-muted-foreground">Precio neto</span>
                                        <p className="font-bold">{fmtNum(netPrice)}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground">Costo total</span>
                                        <p className="font-medium">{fmtNum(Number(vehicle.costo_total))}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-muted-foreground">Utilidad</span>
                                        <p className={`font-bold ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            {fmtNum(profit)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Permuta (trade-in) ── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Permuta (opcional)</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label>Vehículo en Permuta</Label>
                                <Select
                                    value={data.vehicle_permuta_id || '__none__'}
                                    onValueChange={v => {
                                        setData('vehicle_permuta_id', v === '__none__' ? '' : v);
                                        if (v === '__none__') setData('valor_permuta', '0');
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sin permuta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Sin permuta</SelectItem>
                                        {disponibles_permuta.map(v => (
                                            <SelectItem key={v.id} value={String(v.id)}>
                                                {v.marca} {v.modelo} {v.anio}
                                                {v.placa && ` (${v.placa})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {data.vehicle_permuta_id && (
                                <div className="flex flex-col gap-1.5">
                                    <Label>Valor de la Permuta</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.valor_permuta}
                                        onChange={e => setData('valor_permuta', e.target.value)}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Financing (credito_propio only) ── */}
                    {data.tipo_pago === 'credito_propio' && (
                        <Card className="border-purple-200 dark:border-purple-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Financiamiento Propio</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label>Monto del Préstamo <span className="text-destructive">*</span></Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={data.loan.monto_prestamo}
                                        onChange={e => setData('loan', { ...data.loan, monto_prestamo: e.target.value })}
                                    />
                                    {errors['loan.monto_prestamo'] && <p className="text-xs text-destructive">{errors['loan.monto_prestamo']}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label>Tasa Anual (%) <span className="text-destructive">*</span></Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={data.loan.tasa_interes}
                                        onChange={e => setData('loan', { ...data.loan, tasa_interes: e.target.value })}
                                        placeholder="Ej: 18"
                                    />
                                    {errors['loan.tasa_interes'] && <p className="text-xs text-destructive">{errors['loan.tasa_interes']}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label>Plazo (meses) <span className="text-destructive">*</span></Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="360"
                                        value={data.loan.plazo_meses}
                                        onChange={e => setData('loan', { ...data.loan, plazo_meses: e.target.value })}
                                        placeholder="Ej: 24"
                                    />
                                    {errors['loan.plazo_meses'] && <p className="text-xs text-destructive">{errors['loan.plazo_meses']}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label>Inicio del Préstamo <span className="text-destructive">*</span></Label>
                                    <Input
                                        type="date"
                                        value={data.loan.fecha_inicio}
                                        onChange={e => setData('loan', { ...data.loan, fecha_inicio: e.target.value })}
                                    />
                                    {errors['loan.fecha_inicio'] && <p className="text-xs text-destructive">{errors['loan.fecha_inicio']}</p>}
                                </div>

                                {/* Loan preview */}
                                {loanPreview && (
                                    <div className="sm:col-span-2 lg:col-span-4 rounded-md border bg-purple-50/50 dark:bg-purple-950/20 p-3 grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-xs text-muted-foreground">Cuota mensual</span>
                                            <p className="font-bold text-purple-800 dark:text-purple-300">{fmtNum(loanPreview.cuota)}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground">Total a pagar</span>
                                            <p className="font-medium">{fmtNum(loanPreview.totalPagado)}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground">Total intereses</span>
                                            <p className="font-medium text-muted-foreground">{fmtNum(loanPreview.totalInteres)}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Notes ── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Notas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={data.notas}
                                onChange={e => setData('notas', e.target.value)}
                                rows={2}
                                placeholder="Condiciones acordadas, trámites pendientes, observaciones..."
                            />
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(`/autolote/vehicles/${vehicle.id}`)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            Confirmar Venta
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

SaleForm.layout = (page: React.ReactNode) => ({
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Autolote', href: '/autolote/vehicles' },
        { title: 'Registrar Venta', href: '#' },
    ],
    children: page,
});
