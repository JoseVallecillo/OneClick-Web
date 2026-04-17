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
    customer: { id: number; name: string };
    currency: { id: number; code: string; symbol: string };
    customer_po_ref: string | null;
    payment_terms: string | null;
    subtotal: string;
    tax_amount: string;
    total: string;
    notes: string | null;
}

interface Props {
    order: OrderForInvoice;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PAYMENT_TERMS_LABELS: Record<string, string> = {
    immediate: 'Contado (inmediato)',
    net15:     'Neto 15 días',
    net30:     'Neto 30 días',
    net45:     'Neto 45 días',
    net60:     'Neto 60 días',
    net90:     'Neto 90 días',
};

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
        post(`/sales/orders/${order.id}/invoice`);
    }

    return (
        <>
            <Head title={`Facturar — ${order.reference}`} />

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
                        <Receipt className="h-5 w-5 text-green-600" />
                        Emitir Factura de Venta
                    </h1>
                </div>

                {/* Info banner */}
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                    Ingresa los datos de la factura a emitir para <strong>{order.customer.name}</strong>.
                    Los productos ya fueron despachados en el paso anterior.
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
                                    <span className="text-muted-foreground">Cliente</span>
                                    <span className="font-medium">{order.customer.name}</span>
                                </div>
                                {order.customer_po_ref && (
                                    <div className="flex justify-between py-1 border-b">
                                        <span className="text-muted-foreground">OC cliente</span>
                                        <span className="font-mono">{order.customer_po_ref}</span>
                                    </div>
                                )}
                                {order.payment_terms && (
                                    <div className="flex justify-between py-1 border-b">
                                        <span className="text-muted-foreground">Condiciones de pago</span>
                                        <span>{PAYMENT_TERMS_LABELS[order.payment_terms] ?? order.payment_terms}</span>
                                    </div>
                                )}
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="tabular-nums">{sym} {fmtNum(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b">
                                    <span className="text-muted-foreground">Impuestos</span>
                                    <span className="tabular-nums">{sym} {fmtNum(order.tax_amount)}</span>
                                </div>
                                <div className="flex justify-between py-2 font-bold text-base">
                                    <span>Total a cobrar</span>
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
                                    placeholder="Instrucciones de pago, número de cuenta, etc."
                                />
                                {errors.notes && <p className="text-xs text-destructive">{errors.notes}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href={`/sales/orders/${order.id}`}>
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="flex items-center gap-1.5">
                            <Receipt className="h-4 w-4" />
                            Emitir factura y cerrar orden
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
        { title: 'Ventas', href: '/sales/orders' },
        { title: 'Factura', href: '#' },
    ],
};
