import { Badge } from '@/components/ui/badge';
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
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface WarehouseOpt {
    id: number;
    name: string;
    branch?: { name: string };
}

interface ProductOpt {
    id: number;
    sku: string;
    name: string;
    tracking: string;
    cost: number;
    uom: { abbreviation: string };
    category: { name: string };
}

interface LotOpt {
    id: number;
    lot_number: string;
    qty_available: number;
    unit_cost: number;
}

interface Props {
    warehouses: WarehouseOpt[];
    products: ProductOpt[];
    type: string;
}

interface MoveLine {
    product_id: string;
    lot_number: string;
    qty: string;
    unit_cost: string;
}

// ── Type label mapping ─────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
    initial:      'Carga Inicial',
    in:           'Recepción (Entrada)',
    out:          'Salida (Egreso)',
    adjust:       'Ajuste de Inventario',
    transfer_out: 'Traslado (Salida)',
    transfer_in:  'Traslado (Entrada)',
};

const TYPE_BADGE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    initial:      'outline',
    in:           'default',
    out:          'destructive',
    adjust:       'secondary',
    transfer_out: 'outline',
    transfer_in:  'outline',
};

const EMPTY_LINE: MoveLine = { product_id: '__none__', lot_number: '', qty: '1', unit_cost: '0' };

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MovementForm({ warehouses, products, type }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const showDestWarehouse = type === 'transfer_out' || type === 'transfer_in';

    const today = new Date().toISOString().split('T')[0];

    const { data, setData, post, processing, errors } = useForm<{
        warehouse_id: string;
        dest_warehouse_id: string;
        reference: string;
        status: 'draft' | 'confirmed';
        moved_at: string;
        notes: string;
        lines: MoveLine[];
    }>({
        warehouse_id:      '__none__',
        dest_warehouse_id: '__none__',
        reference:         '',
        status:            'confirmed',
        moved_at:          today,
        notes:             '',
        lines:             [{ ...EMPTY_LINE }],
    });

    function addLine() {
        setData('lines', [...data.lines, { ...EMPTY_LINE }]);
    }

    function removeLine(index: number) {
        setData('lines', data.lines.filter((_, i) => i !== index));
    }

    function updateLine(index: number, field: keyof MoveLine, value: string) {
        const updated = data.lines.map((line, i) => {
            if (i !== index) return line;
            const newLine = { ...line, [field]: value };
            // Auto-fill cost when product changes
            if (field === 'product_id') {
                const prod = products.find((p) => String(p.id) === value);
                if (prod) {
                    newLine.unit_cost = String(prod.cost);
                    newLine.lot_number = '';
                }
            }
            return newLine;
        });
        setData('lines', updated);
    }

    function getProduct(productId: string): ProductOpt | undefined {
        return products.find((p) => String(p.id) === productId);
    }

    function lineTotal(line: MoveLine): number {
        return (parseFloat(line.qty) || 0) * (parseFloat(line.unit_cost) || 0);
    }

    function grandTotal(): number {
        return data.lines.reduce((sum, line) => sum + lineTotal(line), 0);
    }

    function submit(status: 'draft' | 'confirmed') {
        setData('status', status);
        // We use a small timeout to ensure setData has updated the status before posting
        // Alternatively, we could just append the status to the post data if useForm supported it easily
        // But Inertia's post doesn't take data object as second param for useForm.
        // So we'll pass status as a separate param or rely on the state.
        post('/inventory/movements', {
            onBefore: () => {
                data.status = status;
            }
        });
    }

    const typeLabel = TYPE_LABELS[type] ?? type;
    const typeBadgeVariant = TYPE_BADGE_VARIANTS[type] ?? 'outline';

    const needsLot = (productId: string) => {
        const prod = getProduct(productId);
        return prod ? prod.tracking !== 'none' : false;
    };

    return (
        <>
            <Head title={`Nuevo movimiento — ${typeLabel}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href="/inventory/movements">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            Movimientos
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">Nueva Operación</h1>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
                    {/* ── Card 1: Header info ────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-3 text-base">
                                Datos del movimiento
                                <Badge variant={typeBadgeVariant} className="text-xs">
                                    {typeLabel}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Warehouse */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Almacén origen *</Label>
                                <Select
                                    value={data.warehouse_id}
                                    onValueChange={(v) => setData('warehouse_id', v)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Seleccionar almacén" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Seleccionar almacén</SelectItem>
                                        {warehouses.map((w) => (
                                            <SelectItem key={w.id} value={String(w.id)}>
                                                {w.name}{w.branch ? ` — ${w.branch.name}` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.warehouse_id && (
                                    <p className="text-xs text-destructive">{errors.warehouse_id}</p>
                                )}
                            </div>

                            {/* Dest warehouse (only for transfers) */}
                            {showDestWarehouse && (
                                <div className="flex flex-col gap-1.5">
                                    <Label>Almacén destino *</Label>
                                    <Select
                                        value={data.dest_warehouse_id}
                                        onValueChange={(v) => setData('dest_warehouse_id', v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Seleccionar destino" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">Seleccionar destino</SelectItem>
                                            {warehouses.map((w) => (
                                                <SelectItem key={w.id} value={String(w.id)}>
                                                    {w.name}{w.branch ? ` — ${w.branch.name}` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.dest_warehouse_id && (
                                        <p className="text-xs text-destructive">{errors.dest_warehouse_id}</p>
                                    )}
                                </div>
                            )}

                            {/* Reference */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="reference">Referencia / Documento</Label>
                                <Input
                                    id="reference"
                                    placeholder="Factura #, Orden #…"
                                    className="font-mono"
                                    value={data.reference}
                                    onChange={(e) => setData('reference', e.target.value)}
                                />
                                {errors.reference && (
                                    <p className="text-xs text-destructive">{errors.reference}</p>
                                )}
                            </div>

                            {/* Moved at */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="moved_at">Fecha del movimiento</Label>
                                <Input
                                    id="moved_at"
                                    type="date"
                                    value={data.moved_at}
                                    onChange={(e) => setData('moved_at', e.target.value)}
                                />
                                {errors.moved_at && (
                                    <p className="text-xs text-destructive">{errors.moved_at}</p>
                                )}
                            </div>

                            {/* Notes */}
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label htmlFor="notes">Notas / Observaciones</Label>
                                <textarea
                                    id="notes"
                                    className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px]"
                                    placeholder="Añade notas internas aquí..."
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Card 2: Lines ──────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Líneas del movimiento</CardTitle>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1.5"
                                    onClick={addLine}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Agregar línea
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 pr-3 font-medium min-w-[200px]">Producto</th>
                                            <th className="pb-2 pr-3 font-medium min-w-[120px]">Lote / Serie</th>
                                            <th className="pb-2 pr-3 font-medium w-24">Cantidad</th>
                                            <th className="pb-2 pr-3 font-medium w-28">Costo Unit.</th>
                                            <th className="pb-2 pr-3 font-medium w-28 text-right">Total</th>
                                            <th className="pb-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.lines.map((line, index) => {
                                            const prod = getProduct(line.product_id);
                                            const showLot = needsLot(line.product_id);

                                            return (
                                                <tr key={index} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                                    <td className="py-2 pr-3">
                                                        <Select
                                                            value={line.product_id}
                                                            onValueChange={(v) => updateLine(index, 'product_id', v)}
                                                        >
                                                            <SelectTrigger className="w-full h-9">
                                                                <SelectValue placeholder="Seleccionar producto" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="__none__">Seleccionar producto</SelectItem>
                                                                {products.map((p) => (
                                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                                        {p.sku} — {p.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {prod && (
                                                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                                {prod.category.name} · {prod.uom.abbreviation}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="py-2 pr-3">
                                                        {showLot ? (
                                                            <Input
                                                                placeholder={prod?.tracking === 'serial' ? 'Nº serie' : 'Nº lote'}
                                                                value={line.lot_number}
                                                                onChange={(e) => updateLine(index, 'lot_number', e.target.value)}
                                                                className="w-full font-mono text-xs h-9"
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 pr-3">
                                                        <Input
                                                            type="number"
                                                            step="0.001"
                                                            min="0.001"
                                                            value={line.qty}
                                                            onChange={(e) => updateLine(index, 'qty', e.target.value)}
                                                            className="w-full text-right tabular-nums h-9"
                                                        />
                                                    </td>
                                                    <td className="py-2 pr-3">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={line.unit_cost}
                                                            onChange={(e) => updateLine(index, 'unit_cost', e.target.value)}
                                                            className="w-full text-right tabular-nums h-9"
                                                        />
                                                    </td>
                                                    <td className="py-2 pr-3 text-right tabular-nums text-xs font-medium">
                                                        {lineTotal(line).toFixed(2)}
                                                    </td>
                                                    <td className="py-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                            disabled={data.lines.length <= 1}
                                                            onClick={() => removeLine(index)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t">
                                            <td colSpan={4} className="pt-3 pr-3 text-right text-sm font-semibold uppercase text-[11px] tracking-wider text-muted-foreground">
                                                Inversión Total:
                                            </td>
                                            <td className="pt-3 pr-3 text-right tabular-nums text-sm font-bold">
                                                {grandTotal().toFixed(2)}
                                            </td>
                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {errors.lines && (
                                <p className="mt-2 text-xs text-destructive">{errors.lines}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit Actions */}
                    <div className="flex items-center justify-between gap-3 border-t pt-6 mb-8">
                        <Link href="/inventory/movements">
                            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="mr-1.5 h-4 w-4" />
                                Cancelar y Volver
                            </Button>
                        </Link>
                        
                        <div className="flex items-center gap-3">
                            <Button 
                                type="button" 
                                variant="outline" 
                                disabled={processing}
                                onClick={() => submit('draft')}
                            >
                                Guardar como Borrador
                            </Button>
                            <Button 
                                type="button" 
                                disabled={processing}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => submit('confirmed')}
                            >
                                {processing
                                    ? <><Spinner className="mr-1" />Procesando…</>
                                    : 'Procesar y Confirmar'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}

MovementForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Inventario', href: '/inventory' },
        { title: 'Operaciones', href: '/inventory/movements' },
        { title: 'Nueva Operación', href: '#' },
    ],
};
