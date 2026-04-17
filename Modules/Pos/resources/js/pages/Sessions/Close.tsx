import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Lock, TriangleAlert } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SessionForClose {
    id: number;
    reference: string;
    name: string | null;
    warehouse: { id: number; name: string };
    currency: { id: number; code: string; symbol: string };
    opening_balance: string;
    total_sales: string;
    total_cash: string;
    total_card: string;
    total_transfer: string;
    sales_count: number;
    voided_count: number;
    notes: string | null;
}

interface Props {
    session: SessionForClose;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtNum(v: string | number) {
    return Number(v).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className={`flex justify-between py-1.5 border-b last:border-0 text-sm ${bold ? 'font-bold text-base' : ''}`}>
            <span className={bold ? '' : 'text-muted-foreground'}>{label}</span>
            <span className="tabular-nums">{value}</span>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SessionClose({ session }: Props) {
    const sym = session.currency.symbol;

    const expectedCash = parseFloat(session.opening_balance) + parseFloat(session.total_cash);

    const { data, setData, post, processing, errors } = useForm({
        closing_balance: String(expectedCash.toFixed(2)),
        notes:           session.notes ?? '',
    });

    const closingBalance = parseFloat(data.closing_balance || '0');
    const difference     = closingBalance - expectedCash;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/pos/sessions/${session.id}/close`);
    }

    return (
        <>
            <Head title={`Cerrar sesión — ${session.reference}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 max-w-2xl">
                {/* Back + title */}
                <div className="flex items-center gap-3">
                    <Link href={`/pos/sessions/${session.id}`}>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            {session.reference}
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <Lock className="h-5 w-5 text-gray-600" />
                        Cerrar Sesión de Caja
                    </h1>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    <div className="flex items-center gap-2 font-medium mb-1">
                        <TriangleAlert className="h-4 w-4" />
                        Esta acción cerrará la caja definitivamente
                    </div>
                    No podrás registrar nuevas ventas en esta sesión una vez cerrada.
                </div>

                {/* Session summary */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Resumen de la sesión</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <SummaryRow label="Saldo inicial (apertura)" value={`${sym} ${fmtNum(session.opening_balance)}`} />
                        <SummaryRow label="Ventas en efectivo" value={`${sym} ${fmtNum(session.total_cash)}`} />
                        <SummaryRow label="Ventas con tarjeta" value={`${sym} ${fmtNum(session.total_card)}`} />
                        <SummaryRow label="Ventas por transferencia" value={`${sym} ${fmtNum(session.total_transfer)}`} />
                        <SummaryRow label={`Total ventas (${session.sales_count} completadas${session.voided_count > 0 ? `, ${session.voided_count} anuladas` : ''})`} value={`${sym} ${fmtNum(session.total_sales)}`} />
                        <SummaryRow label="Efectivo esperado en caja" value={`${sym} ${fmtNum(expectedCash)}`} bold />
                    </CardContent>
                </Card>

                {/* Cash count */}
                <form onSubmit={submit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Arqueo de caja</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label>Efectivo contado físicamente <span className="text-destructive">*</span></Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.closing_balance}
                                    onChange={(e) => setData('closing_balance', e.target.value)}
                                    className="tabular-nums text-lg font-medium max-w-xs"
                                />
                                {errors.closing_balance && <p className="text-xs text-destructive">{errors.closing_balance}</p>}
                            </div>

                            {/* Difference indicator */}
                            {data.closing_balance !== '' && (
                                <div className={`rounded-lg border px-4 py-3 text-sm ${
                                    Math.abs(difference) < 0.01
                                        ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
                                        : difference < 0
                                            ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
                                            : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}>
                                    {Math.abs(difference) < 0.01
                                        ? 'Cuadre perfecto'
                                        : difference < 0
                                            ? `Faltante: ${sym} ${fmtNum(Math.abs(difference))}`
                                            : `Sobrante: ${sym} ${fmtNum(difference)}`
                                    }
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <Label>Notas de cierre</Label>
                                <Textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={2}
                                    placeholder="Observaciones sobre el cierre, diferencias, incidencias…"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Link href={`/pos/sessions/${session.id}`}>
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing} variant="destructive" className="flex items-center gap-1.5">
                            <Lock className="h-4 w-4" />
                            Cerrar sesión definitivamente
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

SessionClose.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Punto de Venta', href: '/pos/sessions' },
        { title: 'Cerrar caja', href: '#' },
    ],
};
