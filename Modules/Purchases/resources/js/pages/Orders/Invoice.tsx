import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Receipt } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface OrderForInvoice {
    id: number;
    reference: string;
    supplier: { id: number; name: string };
    currency: { id: number; code: string; symbol: string };
    subtotal: string;
    tax_amount: string;
    total: string;
    notes: string | null;
}

interface Props {
    order: OrderForInvoice;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtNum(value: string | number) {
    return Number(value).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OrderInvoice({ order }: Props) {
    const today = new Date().toISOString().split('T')[0];
    const sym   = order.currency.symbol;

    const { data, setData, post, processing, errors } = useForm({
        invoice_number:   '',
        invoice_date:     today,
        invoice_due_date: '',
        notes:            order.notes ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/purchases/orders/${order.id}/invoice`);
    }

    return (
        <>
            <Head title={`Facturar — ${order.reference}`} />

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
                        <Receipt className="h-5 w-5 text-purple-600" />
                        Registrar Factura del Proveedor
                    </h1>
                </div>

                {/* Info banner */}
                <div className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-800 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    Ingresa los datos de la factura emitida por <strong>{order.supplier.name}</strong> para completar el proceso de compra.
                    El stock ya fue incrementado en el paso anterior.
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* ── Summary ──────────────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Resumen de la orden</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-1 text-sm">
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Proveedor</span>
                                    <span className="font-medium">{order.supplier.name}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="tabular-nums">{sym} {fmtNum(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Impuestos</span>
                                    <span className="tabular-nums">{sym} {fmtNum(order.tax_amount)}</span>
                                </div>
                                <div className="flex justify-between py-2 font-bold text-base">
                                    <span>Total a pagar</span>
                                    <span className="tabular-nums">{sym} {fmtNum(order.total)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Invoice data ─────────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Datos de la factura</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label>Número de factura <span className="text-destructive">*</span></Label>
                                <Input
                                    value={data.invoice_number}
                                    onChange={(e) => setData('invoice_number', e.target.value)}
                                    placeholder="Ej. FAC-2025-001"
                                    className="font-mono"
                                />
                                {errors.invoice_number && <p className="text-xs text-destructive">{errors.invoice_number}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label>Fecha de la factura <span className="text-destructive">*</span></Label>
                                <Input
                                    type="date"
                                    value={data.invoice_date}
                                    onChange={(e) => setData('invoice_date', e.target.value)}
                                />
                                {errors.invoice_date && <p className="text-xs text-destructive">{errors.invoice_date}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label>Fecha de vencimiento</Label>
                                <Input
                                    type="date"
                                    value={data.invoice_due_date}
                                    onChange={(e) => setData('invoice_due_date', e.target.value)}
                                />
                                {errors.invoice_due_date && <p className="text-xs text-destructive">{errors.invoice_due_date}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label>Notas adicionales</Label>
                                <Textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={2}
                                    placeholder="Condiciones de pago, referencias de pago, etc."
                                />
                                {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href={`/purchases/orders/${order.id}`}>
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="flex items-center gap-1.5">
                            <Receipt className="h-4 w-4" />
                            Registrar factura y cerrar orden
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

OrderInvoice.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Compras', href: '/purchases/orders' },
        { title: 'Factura', href: '#' },
    ],
};
