import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, PackageCheck } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface OrderLine {
    id: number;
    product_id: number;
    description: string | null;
    qty: string;
    qty_received: string;
    unit_cost: string;
    product: { id: number; sku: string; name: string; uom: { abbreviation: string } };
}

interface OrderForReceive {
    id: number;
    reference: string;
    supplier: { id: number; name: string };
    warehouse: { id: number; name: string };
    lines: OrderLine[];
}

interface Props {
    order: OrderForReceive;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtNum(value: string | number) {
    return Number(value).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OrderReceive({ order }: Props) {
    const today = new Date().toISOString().split('T')[0];

    const { data, setData, post, processing, errors } = useForm({
        received_at: today,
        notes: '',
        lines: order.lines.map((l) => ({
            line_id:      l.id,
            qty_received: l.qty,   // default: receive all
        })),
    });

    function updateQty(idx: number, value: string) {
        const updated = data.lines.map((l, i) => (i === idx ? { ...l, qty_received: value } : l));
        setData('lines', updated);
    }

    function receiveAll() {
        setData('lines', order.lines.map((l) => ({ line_id: l.id, qty_received: l.qty })));
    }

    function receiveNone() {
        setData('lines', order.lines.map((l) => ({ line_id: l.id, qty_received: '0' })));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/purchases/orders/${order.id}/receive`);
    }

    return (
        <>
            <Head title={`Recepción — ${order.reference}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Back + title */}
                <div className="flex items-center gap-3">
                    <Link href={`/purchases/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            {order.reference}
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <PackageCheck className="h-5 w-5 text-green-600" />
                        Registrar Recepción
                    </h1>
                </div>

                {/* Info banner */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    <strong>¿Cómo funciona?</strong> Al registrar la recepción se creará automáticamente un movimiento de entrada de stock
                    en el almacén <strong>{order.warehouse.name}</strong>. Solo ingresar las cantidades físicamente recibidas.
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* ── General data ─────────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Datos de la recepción</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label>Fecha de recepción <span className="text-destructive">*</span></Label>
                                <Input type="date" value={data.received_at}
                                    onChange={(e) => setData('received_at', e.target.value)} />
                                {errors.received_at && <p className="text-xs text-destructive">{errors.received_at}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label>Almacén destino</Label>
                                <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                                    {order.warehouse.name}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label>Notas de recepción</Label>
                                <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)}
                                    rows={2} placeholder="Observaciones sobre el estado de los productos, faltantes, etc." />
                                {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Lines ────────────────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Cantidades recibidas</CardTitle>
                                <div className="flex gap-2">
                                    <Button type="button" size="sm" variant="outline" onClick={receiveAll}>
                                        Recibir todo
                                    </Button>
                                    <Button type="button" size="sm" variant="ghost" onClick={receiveNone}>
                                        Limpiar
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 pr-4 font-medium">Producto</th>
                                            <th className="pb-2 pr-4 font-medium text-right">Cant. pedida</th>
                                            <th className="pb-2 pr-4 font-medium text-right">Cant. recibida</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.lines.map((line, idx) => {
                                            const received = parseFloat(data.lines[idx]?.qty_received ?? '0');
                                            const ordered  = parseFloat(line.qty);
                                            const diff     = received - ordered;
                                            return (
                                                <tr key={line.id} className="border-b last:border-0">
                                                    <td className="py-2 pr-4">
                                                        <div className="font-medium">{line.product.name}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">{line.product.sku}</div>
                                                        {line.description && <div className="text-xs text-muted-foreground">{line.description}</div>}
                                                    </td>
                                                    <td className="py-2 pr-4 text-right tabular-nums">
                                                        {fmtNum(line.qty)}{' '}
                                                        <span className="text-xs text-muted-foreground">{line.product.uom.abbreviation}</span>
                                                    </td>
                                                    <td className="py-2">
                                                        <div className="flex flex-col items-end gap-1">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max={String(parseFloat(line.qty) * 2)}
                                                                step="0.01"
                                                                className="h-8 w-32 text-right text-xs tabular-nums"
                                                                value={data.lines[idx]?.qty_received ?? '0'}
                                                                onChange={(e) => updateQty(idx, e.target.value)}
                                                            />
                                                            {diff !== 0 && (
                                                                <span className={`text-[10px] ${diff > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                                                                    {diff > 0 ? `+${fmtNum(diff)} extra` : `${fmtNum(diff)} faltante`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href={`/purchases/orders/${order.id}`}>
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="flex items-center gap-1.5">
                            <PackageCheck className="h-4 w-4" />
                            Confirmar recepción e incrementar stock
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

OrderReceive.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Compras', href: '/purchases/orders' },
        { title: 'Recepción', href: '#' },
    ],
};
