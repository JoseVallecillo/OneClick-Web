import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Ban, CreditCard, Landmark, Printer, ShoppingCart, Wallet } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type SaleStatus = 'completed' | 'voided';
type PaymentMethod = 'cash' | 'card' | 'transfer';

interface SaleLine {
    id: number;
    product: { id: number; sku: string; name: string; uom: { abbreviation: string } };
    qty: string;
    unit_price: string;
    tax_rate: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    description: string | null;
}

interface SaleDetail {
    id: number;
    reference: string;
    status: SaleStatus;
    payment_method: PaymentMethod;
    amount_tendered: string;
    change_given: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    notes: string | null;
    voided_at: string | null;
    created_at: string;
    customer: { id: number; name: string } | null;
    creator: { id: number; name: string };
    lines: SaleLine[];
    session: {
        id: number;
        reference: string;
        name: string | null;
        warehouse: { id: number; name: string };
        currency: { id: number; code: string; symbol: string };
    };
}

interface Props {
    sale: SaleDetail;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PAYMENT_METHOD_MAP: Record<PaymentMethod, { label: string; icon: React.ReactNode }> = {
    cash:     { label: 'Efectivo',       icon: <Wallet className="h-4 w-4" /> },
    card:     { label: 'Tarjeta',         icon: <CreditCard className="h-4 w-4" /> },
    transfer: { label: 'Transferencia',   icon: <Landmark className="h-4 w-4" /> },
};

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleString('es-HN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
    });
}

function fmtNum(v: string | number) {
    return Number(v).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SaleReceipt({ sale }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const sym  = sale.session.currency.symbol;
    const pm   = PAYMENT_METHOD_MAP[sale.payment_method];

    function handleVoid() {
        if (confirm(`¿Anular la venta ${sale.reference}? El stock será restituido.`)) {
            router.post(`/pos/sales/${sale.id}/void`);
        }
    }

    return (
        <>
            <Head title={`Recibo ${sale.reference}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 max-w-2xl">
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

                {/* Header */}
                <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/pos/sessions/${sale.session.id}/sell`}>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            Terminal
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold font-mono">{sale.reference}</h1>
                    <Badge className={`border text-sm px-3 py-1 ${
                        sale.status === 'completed'
                            ? 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                            : 'border-red-300 bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
                    }`}>
                        {sale.status === 'completed' ? 'Completada' : 'Anulada'}
                    </Badge>

                    <div className="ml-auto flex gap-2">
                        <Button variant="outline" size="sm" className="flex items-center gap-1.5" onClick={() => window.print()}>
                            <Printer className="h-3.5 w-3.5" />
                            Imprimir
                        </Button>
                        <Link href={`/pos/sessions/${sale.session.id}/sell`}>
                            <Button size="sm" className="flex items-center gap-1.5">
                                <ShoppingCart className="h-3.5 w-3.5" />
                                Nueva venta
                            </Button>
                        </Link>
                        {sale.status === 'completed' && (
                            <Button variant="ghost" size="sm"
                                className="flex items-center gap-1.5 text-destructive hover:text-destructive"
                                onClick={handleVoid}>
                                <Ban className="h-3.5 w-3.5" />
                                Anular
                            </Button>
                        )}
                    </div>
                </div>

                {/* Receipt card — printable */}
                <Card className="print:shadow-none print:border-0">
                    <CardHeader className="pb-3 print:pb-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-mono">{sale.reference}</CardTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {fmtDate(sale.created_at)} — Caja: {sale.session.reference}
                                    {sale.session.name ? ` (${sale.session.name})` : ''}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Almacén</p>
                                <p className="text-sm">{sale.session.warehouse.name}</p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {/* Customer + cashier */}
                        <div className="flex justify-between text-sm mb-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Cliente</p>
                                <p>{sale.customer?.name ?? 'Consumidor final'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Atendido por</p>
                                <p>{sale.creator.name}</p>
                            </div>
                        </div>

                        <Separator className="mb-3" />

                        {/* Lines */}
                        <table className="w-full text-sm mb-3">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground text-xs">
                                    <th className="pb-1.5 pr-3 font-medium">Producto</th>
                                    <th className="pb-1.5 pr-3 font-medium text-right">Cant.</th>
                                    <th className="pb-1.5 pr-3 font-medium text-right">Precio</th>
                                    <th className="pb-1.5 font-medium text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sale.lines.map((line) => (
                                    <tr key={line.id} className="border-b last:border-0">
                                        <td className="py-1.5 pr-3">
                                            <div className="font-medium">{line.product?.name ?? 'Producto no encontrado'}</div>
                                            {line.description && <div className="text-xs text-muted-foreground">{line.description}</div>}
                                        </td>
                                        <td className="py-1.5 pr-3 text-right tabular-nums text-xs">
                                            {fmtNum(line.qty)} {line.product?.uom?.abbreviation}
                                        </td>
                                        <td className="py-1.5 pr-3 text-right tabular-nums text-xs">
                                            {sym} {fmtNum(line.unit_price)}
                                            {parseFloat(line.tax_rate) > 0 && (
                                                <span className="text-muted-foreground"> +{fmtNum(line.tax_rate)}%</span>
                                            )}
                                        </td>
                                        <td className="py-1.5 text-right tabular-nums font-medium">
                                            {sym} {fmtNum(line.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <Separator className="mb-3" />

                        {/* Totals */}
                        <div className="flex flex-col gap-1 text-sm">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span className="tabular-nums">{sym} {fmtNum(sale.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Impuestos</span>
                                <span className="tabular-nums">{sym} {fmtNum(sale.tax_amount)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold mt-1">
                                <span>TOTAL</span>
                                <span className="tabular-nums">{sym} {fmtNum(sale.total)}</span>
                            </div>
                        </div>

                        <Separator className="my-3" />

                        {/* Payment details */}
                        <div className="flex flex-col gap-1 text-sm">
                            <div className="flex justify-between">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    {pm.icon}
                                    {pm.label}
                                </span>
                                <span className="tabular-nums font-medium">{sym} {fmtNum(sale.amount_tendered)}</span>
                            </div>
                            {parseFloat(sale.change_given) > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cambio devuelto</span>
                                    <span className="tabular-nums text-green-600 font-medium">{sym} {fmtNum(sale.change_given)}</span>
                                </div>
                            )}
                        </div>

                        {sale.notes && (
                            <>
                                <Separator className="my-3" />
                                <p className="text-xs text-muted-foreground">{sale.notes}</p>
                            </>
                        )}

                        {sale.status === 'voided' && (
                            <>
                                <Separator className="my-3" />
                                <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                                    ⚠ Venta anulada el {fmtDate(sale.voided_at)}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SaleReceipt.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Punto de Venta', href: '/pos/sessions' },
        { title: 'Recibo', href: '#' },
    ],
};
