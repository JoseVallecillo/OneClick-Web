import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, ClipboardCheck, Edit, Receipt, Send, Trash2 } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type OrderStatus = 'quote' | 'confirmed' | 'shipped' | 'invoiced';

interface OrderLine {
    id: number;
    product_id: number;
    description: string | null;
    qty: string;
    qty_shipped: string;
    unit_price: string;
    tax_rate: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    product: { id: number; sku: string; name: string; uom: { abbreviation: string } };
}

interface OrderDetail {
    id: number;
    reference: string;
    status: OrderStatus;
    customer: { id: number; name: string };
    warehouse: { id: number; name: string };
    currency: { id: number; code: string; symbol: string };
    creator: { id: number; name: string };
    customer_po_ref: string | null;
    payment_terms: string | null;
    delivery_date: string | null;
    quote_expires_at: string | null;
    confirmed_at: string | null;
    shipped_at: string | null;
    invoiced_at: string | null;
    invoice_number: string | null;
    invoice_date: string | null;
    invoice_due_date: string | null;
    subtotal: string;
    tax_amount: string;
    total: string;
    notes: string | null;
    stock_move: { id: number } | null;
    lines: OrderLine[];
    created_at: string;
}

interface Props {
    order: OrderDetail;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<OrderStatus, { label: string; className: string }> = {
    quote:     { label: 'Cotización',  className: 'border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400' },
    confirmed: { label: 'Confirmada',  className: 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    shipped:   { label: 'Despachada',  className: 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    invoiced:  { label: 'Facturada',   className: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
};

const STEPS: { key: OrderStatus; label: string }[] = [
    { key: 'quote',     label: 'Cotización'  },
    { key: 'confirmed', label: 'Pedido'  },
    { key: 'invoiced',  label: 'Facturada'   },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
    quote: 0, confirmed: 1, shipped: 1, invoiced: 2,
};

const PAYMENT_TERMS_LABELS: Record<string, string> = {
    immediate: 'Contado (inmediato)',
    net15:     'Neto 15 días',
    net30:     'Neto 30 días',
    net45:     'Neto 45 días',
    net60:     'Neto 60 días',
    net90:     'Neto 90 días',
};

function StatusBadge({ status }: { status: OrderStatus }) {
    const info = STATUS_MAP[status];
    return <Badge className={`border text-sm px-3 py-1 ${info.className}`}>{info.label}</Badge>;
}

function fmtDate(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function fmtNum(value: string | number) {
    return Number(value).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-sm">{children}</span>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OrderShow({ order }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const currentStep = STATUS_ORDER[order.status];
    const sym = order.currency.symbol;

    function handleConfirm() {
        if (confirm(`¿Confirmar el pedido ${order.reference}? El stock será reservado automáticamente.`)) {
            router.post(`/sales/orders/${order.id}/confirm`);
        }
    }

    function handleDelete() {
        if (confirm(`¿Eliminar la cotización ${order.reference}? Esta acción no se puede deshacer.`)) {
            router.delete(`/sales/orders/${order.id}`);
        }
    }

    return (
        <>
            <Head title={`Orden ${order.reference}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
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

                {/* ── Header row ───────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3">
                    <Link href="/sales/orders">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            Ventas
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold font-mono">{order.reference}</h1>
                    <StatusBadge status={order.status} />

                    <div className="ml-auto flex flex-wrap gap-2">
                        {order.status === 'quote' && (
                            <>
                                <Link href={`/sales/orders/${order.id}/edit`}>
                                    <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                                        <Edit className="h-3.5 w-3.5" />
                                        Editar
                                    </Button>
                                </Link>
                                <Button size="sm" variant="default" onClick={handleConfirm} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700">
                                    <ClipboardCheck className="h-3.5 w-3.5" />
                                    Confirmar Pedido (Apartar Stock)
                                </Button>
                                <Button size="sm" variant="ghost" onClick={handleDelete}
                                    className="flex items-center gap-1.5 text-destructive hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Eliminar
                                </Button>
                            </>
                        )}
                        {(order.status === 'confirmed' || order.status === 'shipped') && (
                            <Link href={`/sales/orders/${order.id}/invoice`}>
                                <Button size="sm" className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700">
                                    <Receipt className="h-3.5 w-3.5" />
                                    Facturar (Generar Salida Inventario)
                                </Button>
                            </Link>
                        )}
                        {order.status === 'invoiced' && (
                            <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                                <CheckCircle className="h-4 w-4" />
                                Proceso completado
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Workflow progress bar ─────────────────────────────── */}
                <div className="flex items-center gap-0">
                    {STEPS.map((step, idx) => {
                        const done    = STATUS_ORDER[step.key] < currentStep;
                        const active  = step.key === order.status;
                        const pending = STATUS_ORDER[step.key] > currentStep;
                        return (
                            <div key={step.key} className="flex flex-1 flex-col items-center gap-1">
                                <div className="flex w-full items-center">
                                    {idx > 0 && (
                                        <div className={`h-0.5 flex-1 ${done || active ? 'bg-primary' : 'bg-border'}`} />
                                    )}
                                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border-2 ${
                                        done   ? 'border-primary bg-primary text-primary-foreground' :
                                        active ? 'border-primary bg-background text-primary' :
                                                 'border-border bg-background text-muted-foreground'
                                    }`}>
                                        {done ? '✓' : idx + 1}
                                    </div>
                                    {idx < STEPS.length - 1 && (
                                        <div className={`h-0.5 flex-1 ${done ? 'bg-primary' : 'bg-border'}`} />
                                    )}
                                </div>
                                <span className={`text-[10px] font-medium ${active ? 'text-primary' : pending ? 'text-muted-foreground' : 'text-foreground'}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* ── Order header card ─────────────────────────────────── */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Datos de la orden</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailRow label="Cliente">{order.customer.name}</DetailRow>
                        <DetailRow label="Almacén origen">{order.warehouse.name}</DetailRow>
                        <DetailRow label="Moneda">{order.currency.code}</DetailRow>

                        {order.customer_po_ref && (
                            <DetailRow label="OC del cliente">
                                <span className="font-mono">{order.customer_po_ref}</span>
                            </DetailRow>
                        )}
                        {order.payment_terms && (
                            <DetailRow label="Condiciones de pago">
                                {PAYMENT_TERMS_LABELS[order.payment_terms] ?? order.payment_terms}
                            </DetailRow>
                        )}

                        <DetailRow label="Fecha de entrega">{fmtDate(order.delivery_date)}</DetailRow>

                        {order.quote_expires_at && (
                            <DetailRow label="Cotización válida hasta">{fmtDate(order.quote_expires_at)}</DetailRow>
                        )}

                        <DetailRow label="Creado por">{order.creator.name}</DetailRow>
                        <DetailRow label="Fecha creación">{fmtDate(order.created_at)}</DetailRow>

                        {order.confirmed_at && <DetailRow label="Confirmada el">{fmtDate(order.confirmed_at)}</DetailRow>}
                        {order.shipped_at   && <DetailRow label="Despachada el">{fmtDate(order.shipped_at)}</DetailRow>}
                        {order.invoiced_at  && <DetailRow label="Facturada el">{fmtDate(order.invoiced_at)}</DetailRow>}

                        {order.invoice_number && (
                            <>
                                <DetailRow label="Nº Factura emitida">
                                    <span className="font-mono">{order.invoice_number}</span>
                                </DetailRow>
                                <DetailRow label="Fecha factura">{fmtDate(order.invoice_date)}</DetailRow>
                                {order.invoice_due_date && (
                                    <DetailRow label="Vencimiento">{fmtDate(order.invoice_due_date)}</DetailRow>
                                )}
                            </>
                        )}

                        {order.stock_move && (
                            <DetailRow label="Movimiento de stock">
                                <Link href={`/inventory/movements/${order.stock_move.id}`} className="text-primary hover:underline">
                                    Ver movimiento #{order.stock_move.id}
                                </Link>
                            </DetailRow>
                        )}

                        {order.notes && (
                            <div className="flex flex-col gap-0.5 sm:col-span-2 lg:col-span-3">
                                <span className="text-xs text-muted-foreground">Notas</span>
                                <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Lines card ────────────────────────────────────────── */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            Líneas de venta
                            <span className="ml-2 text-sm font-normal text-muted-foreground">({order.lines.length})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="pb-2 pr-4 font-medium">Producto</th>
                                        <th className="pb-2 pr-4 font-medium text-right">Cant. pedida</th>
                                        <th className="pb-2 pr-4 font-medium text-right">Cant. despachada</th>
                                        <th className="pb-2 pr-4 font-medium text-right">Precio unit.</th>
                                        <th className="pb-2 pr-4 font-medium text-right">Impuesto %</th>
                                        <th className="pb-2 pr-4 font-medium text-right">Subtotal</th>
                                        <th className="pb-2 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.lines.map((line) => (
                                        <tr key={line.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                                            <td className="py-2 pr-4">
                                                <div className="font-medium">{line.product.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{line.product.sku}</div>
                                                {line.description && <div className="text-xs text-muted-foreground">{line.description}</div>}
                                            </td>
                                            <td className="py-2 pr-4 text-right tabular-nums">
                                                {fmtNum(line.qty)}{' '}
                                                <span className="text-xs text-muted-foreground">{line.product.uom?.abbreviation}</span>
                                            </td>
                                            <td className="py-2 pr-4 text-right tabular-nums">
                                                {parseFloat(line.qty_shipped) > 0
                                                    ? <span className="text-amber-600 dark:text-amber-400">{fmtNum(line.qty_shipped)}</span>
                                                    : <span className="text-muted-foreground">—</span>}
                                            </td>
                                            <td className="py-2 pr-4 text-right tabular-nums">{sym} {fmtNum(line.unit_price)}</td>
                                            <td className="py-2 pr-4 text-right tabular-nums">{fmtNum(line.tax_rate)}%</td>
                                            <td className="py-2 pr-4 text-right tabular-nums">{sym} {fmtNum(line.subtotal)}</td>
                                            <td className="py-2 text-right tabular-nums font-medium">{sym} {fmtNum(line.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t">
                                        <td colSpan={5} className="pt-3 pr-4 text-right text-sm text-muted-foreground">Subtotal:</td>
                                        <td colSpan={2} className="pt-3 text-right tabular-nums text-sm">{sym} {fmtNum(order.subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={5} className="pr-4 pt-1 text-right text-sm text-muted-foreground">Impuestos:</td>
                                        <td colSpan={2} className="pt-1 text-right tabular-nums text-sm">{sym} {fmtNum(order.tax_amount)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={5} className="pt-2 pr-4 text-right text-sm font-bold">Total:</td>
                                        <td colSpan={2} className="pt-2 text-right tabular-nums text-sm font-bold">{sym} {fmtNum(order.total)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

OrderShow.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Ventas', href: '/sales/orders' },
        { title: 'Detalle', href: '#' },
    ],
};
