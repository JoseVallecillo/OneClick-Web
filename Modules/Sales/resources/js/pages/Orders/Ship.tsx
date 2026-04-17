import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Send } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface OrderLine {
    id: number;
    product_id: number;
    description: string | null;
    qty: string;
    qty_shipped: string;
    unit_price: string;
    product: { id: number; sku: string; name: string; uom: { abbreviation: string } };
}

interface OrderForShip {
    id: number;
    reference: string;
    customer: { id: number; name: string };
    warehouse: { id: number; name: string };
    lines: OrderLine[];
}

interface Props {
    order: OrderForShip;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtNum(value: string | number) {
    return Number(value).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OrderShip({ order }: Props) {
    const today = new Date().toISOString().split('T')[0];

    const { data, setData, post, processing, errors } = useForm({
        shipped_at: today,
        notes: '',
        lines: order.lines.map((l) => ({
            line_id:     l.id,
            qty_shipped: l.qty,   // default: dispatch all
        })),
    });

    function updateQty(idx: number, value: string) {
        const updated = data.lines.map((l, i) => (i === idx ? { ...l, qty_shipped: value } : l));
        setData('lines', updated);
    }

    function shipAll() {
        setData('lines', order.lines.map((l) => ({ line_id: l.id, qty_shipped: l.qty })));
    }

    function shipNone() {
        setData('lines', order.lines.map((l) => ({ line_id: l.id, qty_shipped: '0' })));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/sales/orders/${order.id}/ship`);
    }

    return (
        <>
            <Head title={`Despacho — ${order.reference}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Back + title */}
                <div className="flex items-center gap-3">
                    <Link href={`/sales/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            {order.reference}
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <Send className="h-5 w-5 text-amber-600" />
                        Registrar Despacho
                    </h1>
                </div>

                {/* Info banner */}
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    <strong>¿Cómo funciona?</strong> Al registrar el despacho se creará automáticamente un movimiento de <strong>salida de stock</strong>
                    desde el almacén <strong>{order.warehouse.name}</strong>. Solo ingresar las cantidades físicamente despachadas a <strong>{order.customer.name}</strong>.
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* ── General data ─────────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Datos del despacho</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label>Fecha de despacho <span className="text-destructive">*</span></Label>
                                <Input type="date" value={data.shipped_at}
                                    onChange={(e) => setData('shipped_at', e.target.value)} />
                                {errors.shipped_at && <p className="text-xs text-destructive">{errors.shipped_at}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label>Almacén origen</Label>
                                <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
                                    {order.warehouse.name}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label>Notas de despacho</Label>
                                <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)}
                                    rows={2} placeholder="Número de guía de transporte, observaciones, etc." />
                                {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Lines ────────────────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Cantidades a despachar</CardTitle>
                                <div className="flex gap-2">
                                    <Button type="button" size="sm" variant="outline" onClick={shipAll}>
                                        Despachar todo
                                    </Button>
                                    <Button type="button" size="sm" variant="ghost" onClick={shipNone}>
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
                                            <th className="pb-2 pr-4 font-medium text-right">Cant. a despachar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.lines.map((line, idx) => {
                                            const dispatched = parseFloat(data.lines[idx]?.qty_shipped ?? '0');
                                            const ordered    = parseFloat(line.qty);
                                            const diff       = dispatched - ordered;
                                            return (
                                                <tr key={line.id} className="border-b last:border-0">
                                                    <td className="py-2 pr-4">
                                                        <div className="font-medium">{line.product.name}</div>
                                                        <div className="text-xs text-muted-foreground font-mono">{line.product.sku}</div>
                                                        {line.description && <div className="text-xs text-muted-foreground">{line.description}</div>}
                                                    </td>
                                                    <td className="py-2 pr-4 text-right tabular-nums">
                                                        {fmtNum(line.qty)}{' '}
                                                        <span className="text-xs text-muted-foreground">{line.product.uom?.abbreviation}</span>
                                                    </td>
                                                    <td className="py-2">
                                                        <div className="flex flex-col items-end gap-1">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max={String(parseFloat(line.qty) * 2)}
                                                                step="0.01"
                                                                className="h-8 w-32 text-right text-xs tabular-nums"
                                                                value={data.lines[idx]?.qty_shipped ?? '0'}
                                                                onChange={(e) => updateQty(idx, e.target.value)}
                                                            />
                                                            {diff !== 0 && (
                                                                <span className={`text-[10px] ${diff > 0 ? 'text-amber-600' : 'text-red-500'}`}>
                                                                    {diff > 0 ? `+${fmtNum(diff)} extra` : `${fmtNum(Math.abs(diff))} pendiente`}
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
                        <Link href={`/sales/orders/${order.id}`}>
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="flex items-center gap-1.5">
                            <Send className="h-4 w-4" />
                            Confirmar despacho y reducir stock
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

OrderShip.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Ventas', href: '/sales/orders' },
        { title: 'Despacho', href: '#' },
    ],
};
