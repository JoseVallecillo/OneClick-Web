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
import { dashboard } from '@/routes';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Circle, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type VehicleStatus = 'recepcion' | 'preparacion' | 'exhibicion' | 'apartado' | 'vendido';

interface Expense {
    id: number;
    tipo: string;
    descripcion: string;
    monto: string;
    fecha: string;
}

interface LoanPayment {
    id: number;
    numero_cuota: number;
    fecha_vencimiento: string;
    fecha_pago: string | null;
    monto_cuota: string;
    monto_capital: string;
    monto_interes: string;
    saldo_pendiente: string;
    pagado: boolean;
}

interface VehicleLoan {
    id: number;
    monto_prestamo: string;
    tasa_interes: string;
    plazo_meses: number;
    cuota_mensual: string;
    fecha_inicio: string;
    estado: string;
    payments: LoanPayment[];
}

interface VehicleSale {
    id: number;
    buyer: { id: number; name: string };
    precio_venta: string;
    descuento: string;
    tipo_pago: string;
    valor_permuta: string;
    fecha_venta: string;
    notas: string | null;
    vehicle_permuta: { id: number; marca: string; modelo: string; anio: number } | null;
    loan: VehicleLoan | null;
}

interface Vehicle {
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
    estado: VehicleStatus;
    precio_compra: string;
    costo_total: string;
    received_at: string;
    notas: string | null;
    vendedor: { id: number; name: string } | null;
    expenses: Expense[];
    sale: VehicleSale | null;
}

interface Props {
    vehicle: Vehicle;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_STEPS: { key: VehicleStatus; label: string }[] = [
    { key: 'recepcion',   label: 'Recepción' },
    { key: 'preparacion', label: 'Preparación' },
    { key: 'exhibicion',  label: 'Exhibición' },
    { key: 'apartado',    label: 'Apartado' },
    { key: 'vendido',     label: 'Vendido' },
];

const STATUS_BADGE: Record<VehicleStatus, string> = {
    recepcion:   'bg-slate-100 text-slate-700',
    preparacion: 'bg-yellow-100 text-yellow-800',
    exhibicion:  'bg-blue-100 text-blue-800',
    apartado:    'bg-orange-100 text-orange-800',
    vendido:     'bg-green-100 text-green-800',
};

const TIPO_PAGO_LABEL: Record<string, string> = {
    contado:                'Contado',
    credito_propio:         'Crédito Propio',
    financiamiento_externo: 'Financiamiento Externo',
};

const EXPENSE_TIPO_LABEL: Record<string, string> = {
    mecanica:  'Mecánica',
    pintura:   'Pintura',
    lavado:    'Lavado',
    tapiceria: 'Tapicería',
    electrico: 'Eléctrico',
    otro:      'Otro',
};

function fmtNum(n: string | number) {
    return Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value ?? '—'}</span>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function VehicleShow({ vehicle }: Props) {
    const { props } = usePage<any>();
    const flash = props.flash as { success?: string; error?: string } | undefined;

    // Expense form
    const expForm = useForm({
        tipo:        'mecanica',
        descripcion: '',
        monto:       '',
        fecha:       new Date().toISOString().slice(0, 10),
    });

    const [showExpForm, setShowExpForm] = useState(false);

    function submitExpense(e: React.FormEvent) {
        e.preventDefault();
        expForm.post(`/autolote/vehicles/${vehicle.id}/expenses`, {
            onSuccess: () => {
                expForm.reset();
                setShowExpForm(false);
            },
        });
    }

    // Transition
    function transition(estado: VehicleStatus) {
        router.post(`/autolote/vehicles/${vehicle.id}/transition`, { estado });
    }

    // Delete vehicle
    function deleteVehicle() {
        if (!confirm('¿Eliminar este vehículo? Esta acción no se puede deshacer.')) return;
        router.delete(`/autolote/vehicles/${vehicle.id}`);
    }

    // Delete expense
    function deleteExpense(expenseId: number) {
        if (!confirm('¿Eliminar este gasto?')) return;
        router.delete(`/autolote/vehicles/${vehicle.id}/expenses/${expenseId}`);
    }

    // Register payment
    const payForm = useForm({ fecha_pago: new Date().toISOString().slice(0, 10) });
    const [payingId, setPayingId] = useState<number | null>(null);

    function registerPayment(loanId: number, paymentId: number) {
        payForm.post(`/autolote/loans/${loanId}/payments/${paymentId}/pay`, {
            onSuccess: () => setPayingId(null),
        });
    }

    const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === vehicle.estado);

    const canTransitionTo = (key: VehicleStatus): boolean => {
        if (vehicle.estado === 'vendido') return false;
        if (key === vehicle.estado) return false;
        // Allow back-and-forth between exhibicion and apartado
        if (vehicle.estado === 'exhibicion' && key === 'apartado') return true;
        if (vehicle.estado === 'apartado'   && key === 'exhibicion') return true;
        const idx = STATUS_STEPS.findIndex(s => s.key === key);
        return idx === currentStepIdx + 1;
    };

    return (
        <>
            <Head title={`${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">

                {/* Flash */}
                {flash?.success && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center gap-3 flex-wrap">
                    <Link href="/autolote/vehicles">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            Inventario
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">
                        {vehicle.marca} {vehicle.modelo} {vehicle.anio}
                    </h1>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[vehicle.estado]}`}>
                        {STATUS_STEPS.find(s => s.key === vehicle.estado)?.label}
                    </span>
                    {vehicle.gravamen && (
                        <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                            Gravamen
                        </span>
                    )}
                </div>

                {/* Lifecycle stepper */}
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-0">
                            {STATUS_STEPS.map((step, idx) => {
                                const done    = idx < currentStepIdx;
                                const current = idx === currentStepIdx;
                                const canGo   = canTransitionTo(step.key);
                                return (
                                    <div key={step.key} className="flex items-center flex-1">
                                        <div className="flex flex-col items-center gap-1 flex-1">
                                            <button
                                                onClick={() => canGo && transition(step.key)}
                                                disabled={!canGo}
                                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                                                    current
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : done
                                                        ? 'border-green-500 bg-green-500 text-white'
                                                        : canGo
                                                        ? 'border-primary bg-background text-primary hover:bg-primary/10 cursor-pointer'
                                                        : 'border-muted bg-background text-muted-foreground cursor-not-allowed'
                                                }`}
                                            >
                                                {done ? (
                                                    <CheckCircle2 className="h-4 w-4" />
                                                ) : (
                                                    <Circle className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                            <span className={`text-[10px] font-medium text-center ${current ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {step.label}
                                            </span>
                                        </div>
                                        {idx < STATUS_STEPS.length - 1 && (
                                            <div className={`h-0.5 w-full mt-[-14px] ${done ? 'bg-green-400' : 'bg-border'}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Details grid */}
                <div className="grid gap-6 lg:grid-cols-2">

                    {/* Identification */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Identificación</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <DetailRow label="VIN / Chasis" value={<span className="font-mono">{vehicle.vin}</span>} />
                            <DetailRow label="Placa" value={<span className="font-mono">{vehicle.placa}</span>} />
                            <DetailRow label="Motor" value={<span className="font-mono">{vehicle.motor}</span>} />
                            <DetailRow label="Recepción" value={vehicle.received_at} />
                        </CardContent>
                    </Card>

                    {/* Specs */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Especificaciones</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <DetailRow label="Color" value={vehicle.color} />
                            <DetailRow label="Transmisión" value={vehicle.transmision.charAt(0).toUpperCase() + vehicle.transmision.slice(1)} />
                            <DetailRow label="Kilometraje" value={`${vehicle.kilometraje.toLocaleString()} km`} />
                            <DetailRow label="Dueños anteriores" value={vehicle.num_duenos_anteriores} />
                        </CardContent>
                    </Card>

                    {/* Legal */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Estado Legal</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <DetailRow
                                label="Estado de Aduana"
                                value={{
                                    nacional:   'Nacional',
                                    en_tramite: 'En Trámite',
                                    importado:  'Importado',
                                    exonerado:  'Exonerado',
                                }[vehicle.estado_aduana] ?? vehicle.estado_aduana}
                            />
                            <DetailRow label="Gravamen" value={vehicle.gravamen ? 'Sí' : 'No'} />
                            <DetailRow label="Proveedor" value={vehicle.vendedor?.name} />
                        </CardContent>
                    </Card>

                    {/* Costs */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Costos</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <DetailRow label="Precio de Compra" value={fmtNum(vehicle.precio_compra)} />
                            <DetailRow label="Gastos Capitalizados" value={fmtNum(
                                (Number(vehicle.costo_total) - Number(vehicle.precio_compra)).toFixed(4)
                            )} />
                            <div className="col-span-2 border-t pt-3">
                                <DetailRow
                                    label="Costo Total Real"
                                    value={<span className="text-lg font-bold">{fmtNum(vehicle.costo_total)}</span>}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Notes */}
                {vehicle.notas && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Notas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{vehicle.notas}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Expenses */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Gastos de Preparación</CardTitle>
                            {vehicle.estado !== 'vendido' && !showExpForm && (
                                <Button type="button" size="sm" variant="outline" onClick={() => setShowExpForm(true)} className="flex items-center gap-1.5">
                                    <Plus className="h-3.5 w-3.5" />
                                    Agregar Gasto
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">

                        {/* Add expense form */}
                        {showExpForm && (
                            <form onSubmit={submitExpense} className="rounded-md border p-4 flex flex-col gap-3 bg-muted/20">
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-xs">Tipo</Label>
                                        <Select value={expForm.data.tipo} onValueChange={v => expForm.setData('tipo', v)}>
                                            <SelectTrigger className="h-8 text-sm">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(EXPENSE_TIPO_LABEL).map(([k, v]) => (
                                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-1.5 sm:col-span-1 lg:col-span-2">
                                        <Label className="text-xs">Descripción</Label>
                                        <Input
                                            className="h-8 text-sm"
                                            value={expForm.data.descripcion}
                                            onChange={e => expForm.setData('descripcion', e.target.value)}
                                            placeholder="Detalle del trabajo..."
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-xs">Monto</Label>
                                        <Input
                                            className="h-8 text-sm text-right"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={expForm.data.monto}
                                            onChange={e => expForm.setData('monto', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <Label className="text-xs">Fecha</Label>
                                        <Input
                                            className="h-8 text-sm"
                                            type="date"
                                            value={expForm.data.fecha}
                                            onChange={e => expForm.setData('fecha', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowExpForm(false)}>Cancelar</Button>
                                    <Button type="submit" size="sm" disabled={expForm.processing}>Guardar</Button>
                                </div>
                            </form>
                        )}

                        {/* Expenses table */}
                        {vehicle.expenses.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">Sin gastos registrados.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 pr-3 font-medium">Tipo</th>
                                            <th className="pb-2 pr-3 font-medium">Descripción</th>
                                            <th className="pb-2 pr-3 font-medium text-right">Monto</th>
                                            <th className="pb-2 pr-3 font-medium">Fecha</th>
                                            <th className="pb-2 w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vehicle.expenses.map(exp => (
                                            <tr key={exp.id} className="border-b last:border-0">
                                                <td className="py-2 pr-3">
                                                    <span className="text-xs rounded bg-muted px-1.5 py-0.5">
                                                        {EXPENSE_TIPO_LABEL[exp.tipo] ?? exp.tipo}
                                                    </span>
                                                </td>
                                                <td className="py-2 pr-3">{exp.descripcion}</td>
                                                <td className="py-2 pr-3 text-right tabular-nums">{fmtNum(exp.monto)}</td>
                                                <td className="py-2 pr-3 text-muted-foreground">{exp.fecha}</td>
                                                <td className="py-2">
                                                    {vehicle.estado !== 'vendido' && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                                            onClick={() => deleteExpense(exp.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t">
                                            <td colSpan={2} className="pt-2 pr-3 text-right text-sm font-medium text-muted-foreground">Total gastos:</td>
                                            <td className="pt-2 pr-3 text-right text-sm font-bold tabular-nums">
                                                {fmtNum(vehicle.expenses.reduce((s, e) => s + Number(e.monto), 0))}
                                            </td>
                                            <td colSpan={2}></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sale info */}
                {vehicle.sale ? (
                    <>
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">Venta</CardTitle>
                                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                                        vehicle.sale.tipo_pago === 'credito_propio'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {TIPO_PAGO_LABEL[vehicle.sale.tipo_pago]}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                <DetailRow label="Comprador" value={vehicle.sale.buyer.name} />
                                <DetailRow label="Fecha de Venta" value={vehicle.sale.fecha_venta} />
                                <DetailRow label="Precio de Venta" value={fmtNum(vehicle.sale.precio_venta)} />
                                {Number(vehicle.sale.descuento) > 0 && (
                                    <DetailRow label="Descuento" value={`- ${fmtNum(vehicle.sale.descuento)}`} />
                                )}
                                {Number(vehicle.sale.valor_permuta) > 0 && (
                                    <DetailRow
                                        label="Permuta"
                                        value={
                                            <span>
                                                {vehicle.sale.vehicle_permuta
                                                    ? `${vehicle.sale.vehicle_permuta.marca} ${vehicle.sale.vehicle_permuta.modelo} ${vehicle.sale.vehicle_permuta.anio}`
                                                    : '—'
                                                } ({fmtNum(vehicle.sale.valor_permuta)})
                                            </span>
                                        }
                                    />
                                )}
                                <DetailRow
                                    label="Precio Neto"
                                    value={
                                        <span className="text-base font-bold">
                                            {fmtNum(
                                                Number(vehicle.sale.precio_venta)
                                                - Number(vehicle.sale.descuento)
                                                - Number(vehicle.sale.valor_permuta)
                                            )}
                                        </span>
                                    }
                                />
                                <DetailRow
                                    label="Utilidad"
                                    value={
                                        <span className={Number(vehicle.sale.precio_venta) - Number(vehicle.sale.descuento) - Number(vehicle.sale.valor_permuta) >= Number(vehicle.costo_total) ? 'text-green-700' : 'text-red-700'}>
                                            {fmtNum(
                                                Number(vehicle.sale.precio_venta)
                                                - Number(vehicle.sale.descuento)
                                                - Number(vehicle.sale.valor_permuta)
                                                - Number(vehicle.costo_total)
                                            )}
                                        </span>
                                    }
                                />
                                {vehicle.sale.notas && (
                                    <div className="col-span-2 sm:col-span-3">
                                        <DetailRow label="Notas" value={vehicle.sale.notas} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Loan amortization */}
                        {vehicle.sale.loan && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">Tabla de Amortización</CardTitle>
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <span>Cuota: <strong>{fmtNum(vehicle.sale.loan.cuota_mensual)}</strong></span>
                                            <span>Plazo: <strong>{vehicle.sale.loan.plazo_meses} meses</strong></span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                vehicle.sale.loan.estado === 'pagado'
                                                    ? 'bg-green-100 text-green-800'
                                                    : vehicle.sale.loan.estado === 'activo'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {vehicle.sale.loan.estado.charAt(0).toUpperCase() + vehicle.sale.loan.estado.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left text-muted-foreground">
                                                    <th className="pb-2 pr-3 font-medium">#</th>
                                                    <th className="pb-2 pr-3 font-medium">Vencimiento</th>
                                                    <th className="pb-2 pr-3 text-right font-medium">Cuota</th>
                                                    <th className="pb-2 pr-3 text-right font-medium">Capital</th>
                                                    <th className="pb-2 pr-3 text-right font-medium">Interés</th>
                                                    <th className="pb-2 pr-3 text-right font-medium">Saldo</th>
                                                    <th className="pb-2 font-medium">Pagado</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {vehicle.sale.loan.payments.map(p => (
                                                    <tr key={p.id} className={`border-b last:border-0 ${p.pagado ? 'opacity-60' : ''}`}>
                                                        <td className="py-1.5 pr-3 font-mono text-xs">{p.numero_cuota}</td>
                                                        <td className="py-1.5 pr-3 text-xs">{p.fecha_vencimiento}</td>
                                                        <td className="py-1.5 pr-3 text-right tabular-nums">{fmtNum(p.monto_cuota)}</td>
                                                        <td className="py-1.5 pr-3 text-right tabular-nums text-muted-foreground">{fmtNum(p.monto_capital)}</td>
                                                        <td className="py-1.5 pr-3 text-right tabular-nums text-muted-foreground">{fmtNum(p.monto_interes)}</td>
                                                        <td className="py-1.5 pr-3 text-right tabular-nums">{fmtNum(p.saldo_pendiente)}</td>
                                                        <td className="py-1.5">
                                                            {p.pagado ? (
                                                                <div className="flex items-center gap-1 text-xs text-green-700">
                                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                                    {p.fecha_pago}
                                                                </div>
                                                            ) : (
                                                                payingId === p.id ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <Input
                                                                            type="date"
                                                                            className="h-6 w-32 text-xs px-1"
                                                                            value={payForm.data.fecha_pago}
                                                                            onChange={e => payForm.setData('fecha_pago', e.target.value)}
                                                                        />
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            className="h-6 px-2 text-xs"
                                                                            disabled={payForm.processing}
                                                                            onClick={() => registerPayment(vehicle.sale!.loan!.id, p.id)}
                                                                        >
                                                                            OK
                                                                        </Button>
                                                                        <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setPayingId(null)}>
                                                                            ✕
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-6 px-2 text-xs"
                                                                        onClick={() => setPayingId(p.id)}
                                                                    >
                                                                        Registrar pago
                                                                    </Button>
                                                                )
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                ) : null}

                {/* Action bar */}
                <div className="flex items-center gap-3 flex-wrap">
                    <Link href={`/autolote/vehicles/${vehicle.id}/edit`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                            <Pencil className="h-4 w-4" />
                            Editar
                        </Button>
                    </Link>

                    {(vehicle.estado === 'exhibicion' || vehicle.estado === 'apartado') && !vehicle.sale && (
                        <Link href={`/autolote/vehicles/${vehicle.id}/sell`}>
                            <Button size="sm" className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                                Registrar Venta
                            </Button>
                        </Link>
                    )}

                    {vehicle.estado === 'recepcion' && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive ml-auto"
                            onClick={deleteVehicle}
                        >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Eliminar
                        </Button>
                    )}
                </div>
            </div>
        </>
    );
}

VehicleShow.layout = (page: React.ReactNode) => ({
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Autolote', href: '/autolote/vehicles' },
        { title: 'Vehículo', href: '#' },
    ],
    children: page,
});
