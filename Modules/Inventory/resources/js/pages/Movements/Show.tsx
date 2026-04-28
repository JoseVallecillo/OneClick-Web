import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface MoveLineDetail {
    id: number;
    qty: number;
    unit_cost: number;
    total_cost: number;
    product: { id: number; sku: string; name: string; uom: { abbreviation: string } };
    lot: { id: number; lot_number: string } | null;
}

interface MoveDetail {
    id: number;
    type: string;
    status: 'draft' | 'confirmed';
    reference: string | null;
    notes: string | null;
    accounting_pending: boolean;
    moved_at: string;
    warehouse: { id: number; name: string };
    dest_warehouse: { id: number; name: string } | null;
    creator: { id: number; name: string };
    lines: MoveLineDetail[];
}

interface Props {
    move: MoveDetail;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

type MoveType = 'initial' | 'in' | 'out' | 'adjust' | 'transfer_in' | 'transfer_out';

const MOVE_TYPE_MAP: Record<MoveType, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    initial:      { label: 'Carga Inicial',         variant: 'outline'     },
    in:           { label: 'Entrada',               variant: 'default'     },
    out:          { label: 'Salida',                variant: 'destructive' },
    adjust:       { label: 'Ajuste',                variant: 'secondary'   },
    transfer_in:  { label: 'Traslado Entrada',      variant: 'outline'     },
    transfer_out: { label: 'Traslado Salida',       variant: 'outline'     },
};

function MoveBadge({ type }: { type: string }) {
    const info = MOVE_TYPE_MAP[type as MoveType] ?? { label: type, variant: 'outline' as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'draft') {
        return <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Borrador</Badge>;
    }
    return <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Procesada</Badge>;
}

function fmtDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-HN', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
}

function fmtNum(value: number | string) {
    return Number(value).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Detail row ─────────────────────────────────────────────────────────────────

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-sm">{children}</span>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MovementShow({ move }: Props) {
    const grandTotal = move.lines.reduce((sum, l) => sum + Number(l.total_cost), 0);

    return (
        <>
            <Head title={`Movimiento #${move.id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Back button */}
                <div className="flex items-center gap-3">
                    <Link href="/inventory/movements">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            Movimientos
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">Movimiento #{move.id}</h1>
                    <MoveBadge type={move.type} />
                    <StatusBadge status={move.status} />
                    
                    {move.status === 'draft' && (
                        <div className="ml-auto">
                            <Button 
                                onClick={() => router.post(`/inventory/movements/${move.id}/confirm`)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                Confirmar Operación
                            </Button>
                        </div>
                    )}
                </div>

                {/* ── Card: move details ──────────────────────────────────── */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Datos del movimiento</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <DetailRow label="Fecha">
                            {fmtDate(move.moved_at)}
                        </DetailRow>

                        <DetailRow label="Almacén origen">
                            {move.warehouse.name}
                        </DetailRow>

                        {move.dest_warehouse && (
                            <DetailRow label="Almacén destino">
                                {move.dest_warehouse.name}
                            </DetailRow>
                        )}

                        <DetailRow label="Referencia / Documento">
                            {move.reference
                                ? <span className="font-mono">{move.reference}</span>
                                : <span className="text-muted-foreground">—</span>}
                        </DetailRow>

                        <DetailRow label="Registrado por">
                            {move.creator.name}
                        </DetailRow>

                        {move.notes && (
                            <div className="flex flex-col gap-0.5 sm:col-span-2 lg:col-span-3">
                                <span className="text-xs text-muted-foreground">Notas</span>
                                <p className="text-sm whitespace-pre-wrap">{move.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Card: lines ─────────────────────────────────────────── */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            Líneas
                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                ({move.lines.length})
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="pb-2 pr-4 font-medium">Producto</th>
                                        <th className="pb-2 pr-4 font-medium">Lote / Serie</th>
                                        <th className="pb-2 pr-4 font-medium text-right">Cantidad</th>
                                        <th className="pb-2 pr-4 font-medium text-right">Costo Unit.</th>
                                        <th className="pb-2 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {move.lines.map((line) => (
                                        <tr key={line.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="py-2 pr-4">
                                                <div className="font-medium">{line.product.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono">{line.product.sku}</div>
                                            </td>
                                            <td className="py-2 pr-4 font-mono text-xs">
                                                {line.lot
                                                    ? line.lot.lot_number
                                                    : <span className="text-muted-foreground">—</span>}
                                            </td>
                                            <td className="py-2 pr-4 text-right tabular-nums">
                                                {fmtNum(line.qty)}{' '}
                                                <span className="text-xs text-muted-foreground">
                                                    {line.product.uom?.abbreviation ?? '—'}
                                                </span>
                                            </td>
                                            <td className="py-2 pr-4 text-right tabular-nums">
                                                {fmtNum(line.unit_cost)}
                                            </td>
                                            <td className="py-2 text-right tabular-nums font-medium">
                                                {fmtNum(line.total_cost)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t">
                                        <td colSpan={4} className="pt-3 pr-4 text-right text-sm font-semibold">
                                            Total:
                                        </td>
                                        <td className="pt-3 text-right tabular-nums text-sm font-bold">
                                            {fmtNum(grandTotal)}
                                        </td>
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

MovementShow.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Inventario', href: '/inventory' },
        { title: 'Movimientos', href: '/inventory/movements' },
        { title: 'Detalle', href: '#' },
    ],
};
