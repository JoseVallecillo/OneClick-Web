import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Lock, ShoppingCart, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type SessionStatus = 'open' | 'closed';
type SaleStatus = 'completed' | 'voided';
type PaymentMethod = 'cash' | 'card' | 'transfer';

interface SaleRow {
    id: number;
    reference: string;
    status: SaleStatus;
    payment_method: PaymentMethod;
    total: string;
    customer: { id: number; name: string } | null;
    creator: { id: number; name: string };
    lines_count: number;
    created_at: string;
}

interface SessionDetail {
    id: number;
    reference: string;
    name: string | null;
    status: SessionStatus;
    warehouse: { id: number; name: string };
    currency: { id: number; code: string; symbol: string };
    creator: { id: number; name: string };
    opening_balance: string;
    closing_balance: string | null;
    total_sales: string;
    total_cash: string;
    total_card: string;
    total_transfer: string;
    sales_count: number;
    voided_count: number;
    opened_at: string | null;
    closed_at: string | null;
    notes: string | null;
}

interface PaginatedSales {
    data: SaleRow[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; from: number | null; to: number | null; total: number; per_page: number };
}

interface Props {
    session: SessionDetail;
    sales: PaginatedSales;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const SALE_STATUS_MAP: Record<SaleStatus, { label: string; className: string }> = {
    completed: { label: 'Completada', className: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
    voided:    { label: 'Anulada',    className: 'border-red-300 bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300' },
};

const PAYMENT_METHOD_MAP: Record<PaymentMethod, string> = {
    cash:     'Efectivo',
    card:     'Tarjeta',
    transfer: 'Transferencia',
};

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function fmtNum(v: string | number) {
    return Number(v).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
        <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SessionShow({ session, sales }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const sym = session.currency.symbol;

    const [errorModalOpen, setErrorModalOpen] = useState(!!flash?.error);
    useEffect(() => {
        setErrorModalOpen(!!flash?.error);
    }, [flash?.error]);

    const { data } = sales;
    const meta = sales.meta ?? { current_page: 1, last_page: 1, from: null, to: null, total: data.length, per_page: 50 };

    const expectedCash = parseFloat(session.opening_balance) + parseFloat(session.total_cash);

    return (
        <>
            <Head title={`Sesión ${session.reference}`} />

            <AlertDialog open={errorModalOpen} onOpenChange={setErrorModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" /> Acción bloqueada
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-foreground mt-2">
                            {flash?.error}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setErrorModalOpen(false)}>Entendido</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                        {flash.success}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-wrap items-center gap-3">
                    <Link href="/pos/sessions">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            Sesiones
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold font-mono">{session.reference}</h1>
                    {session.name && <span className="text-muted-foreground text-sm">— {session.name}</span>}
                    <Badge className={`border ${session.status === 'open'
                        ? 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                        : 'border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400'}`}>
                        {session.status === 'open' ? 'Abierta' : 'Cerrada'}
                    </Badge>

                    <div className="ml-auto flex gap-2">
                        {session.status === 'open' && (
                            <>
                                <Link href={`/pos/sessions/${session.id}/sell`}>
                                    <Button size="sm" className="flex items-center gap-1.5">
                                        <ShoppingCart className="h-3.5 w-3.5" />
                                        Ir al terminal
                                    </Button>
                                </Link>
                                <Link href={`/pos/sessions/${session.id}/close`}>
                                    <Button size="sm" variant="outline" className="flex items-center gap-1.5">
                                        <Lock className="h-3.5 w-3.5" />
                                        Cerrar caja
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Total ventas" value={`${sym} ${fmtNum(session.total_sales)}`} sub={`${session.sales_count} ventas`} />
                    <StatCard label="Efectivo" value={`${sym} ${fmtNum(session.total_cash)}`} />
                    <StatCard label="Tarjeta" value={`${sym} ${fmtNum(session.total_card)}`} />
                    <StatCard label="Transferencia" value={`${sym} ${fmtNum(session.total_transfer)}`} />
                </div>

                {/* Session details */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Datos de la sesión</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                        <div><p className="text-xs text-muted-foreground">Almacén</p><p>{session.warehouse.name}</p></div>
                        <div><p className="text-xs text-muted-foreground">Moneda</p><p>{session.currency.code}</p></div>
                        <div><p className="text-xs text-muted-foreground">Cajero</p><p>{session.creator.name}</p></div>
                        <div><p className="text-xs text-muted-foreground">Saldo inicial</p><p className="tabular-nums">{sym} {fmtNum(session.opening_balance)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Efectivo esperado en caja</p><p className="tabular-nums font-medium">{sym} {fmtNum(expectedCash)}</p></div>
                        {session.closing_balance !== null && (
                            <div>
                                <p className="text-xs text-muted-foreground">Efectivo contado al cierre</p>
                                <p className={`tabular-nums font-medium ${
                                    parseFloat(session.closing_balance) < expectedCash ? 'text-red-600' : 'text-green-600'
                                }`}>{sym} {fmtNum(session.closing_balance)}</p>
                            </div>
                        )}
                        <div><p className="text-xs text-muted-foreground">Apertura</p><p>{fmtDate(session.opened_at)}</p></div>
                        {session.closed_at && <div><p className="text-xs text-muted-foreground">Cierre</p><p>{fmtDate(session.closed_at)}</p></div>}
                        {session.voided_count > 0 && <div><p className="text-xs text-muted-foreground">Anuladas</p><p className="text-red-600">{session.voided_count}</p></div>}
                        {session.notes && (
                            <div className="sm:col-span-2 lg:col-span-3">
                                <p className="text-xs text-muted-foreground">Notas</p>
                                <p className="whitespace-pre-wrap">{session.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Sales list */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            Ventas de esta sesión
                            <span className="ml-2 text-sm font-normal text-muted-foreground">({meta.total})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="py-10 text-center text-sm text-muted-foreground">No hay ventas en esta sesión.</div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="pb-2 pr-3 font-medium">Referencia</th>
                                                <th className="pb-2 pr-3 font-medium">Estado</th>
                                                <th className="pb-2 pr-3 font-medium">Pago</th>
                                                <th className="pb-2 pr-3 font-medium">Cliente</th>
                                                <th className="pb-2 pr-3 font-medium text-center">Items</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Total</th>
                                                <th className="pb-2 pr-3 font-medium">Hora</th>
                                                <th className="pb-2 font-medium">Ver</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((sale) => {
                                                const st = SALE_STATUS_MAP[sale.status];
                                                return (
                                                    <tr key={sale.id} className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${sale.status === 'voided' ? 'opacity-50' : ''}`}>
                                                        <td className="py-2 pr-3 font-mono text-xs font-semibold">{sale.reference}</td>
                                                        <td className="py-2 pr-3">
                                                            <Badge className={`text-[10px] border ${st.className}`}>{st.label}</Badge>
                                                        </td>
                                                        <td className="py-2 pr-3 text-xs">{PAYMENT_METHOD_MAP[sale.payment_method]}</td>
                                                        <td className="py-2 pr-3 text-xs">{sale.customer?.name ?? <span className="text-muted-foreground">Consumidor final</span>}</td>
                                                        <td className="py-2 pr-3 text-center text-xs tabular-nums">{sale.lines_count}</td>
                                                        <td className="py-2 pr-3 text-right text-xs tabular-nums font-medium">
                                                            {sym} {fmtNum(sale.total)}
                                                        </td>
                                                        <td className="py-2 pr-3 text-xs text-muted-foreground">{fmtDate(sale.created_at)}</td>
                                                        <td className="py-2">
                                                            <Link href={`/pos/sales/${sale.id}/receipt`}>
                                                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">Ver</Button>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {meta.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
                                        <span className="text-xs text-muted-foreground">{meta.from}–{meta.to} de {meta.total}</span>
                                        <div className="flex items-center gap-1">
                                            {sales.links.map((link, i) => {
                                                if (link.label === '&laquo; Previous') return (
                                                    <Button key={i} variant="outline" size="sm" className="h-7 w-7 p-0" disabled={!link.url}
                                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>
                                                        <ChevronLeft className="h-3.5 w-3.5" />
                                                    </Button>
                                                );
                                                if (link.label === 'Next &raquo;') return (
                                                    <Button key={i} variant="outline" size="sm" className="h-7 w-7 p-0" disabled={!link.url}
                                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                );
                                                return (
                                                    <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm"
                                                        className="h-7 min-w-[28px] px-2 text-xs" disabled={!link.url || link.active}
                                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SessionShow.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Punto de Venta', href: '/pos/sessions' },
        { title: 'Sesión', href: '#' },
    ],
};
