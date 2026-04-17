import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowDownToLine, ArrowUpFromLine, ChevronLeft, ChevronRight, Eye, GitCompare, ListFilter, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface MoveRow {
    id: number;
    type: string;
    status: 'draft' | 'confirmed';
    reference: string | null;
    notes: string | null;
    accounting_pending: boolean;
    moved_at: string;
    warehouse: { id: number; name: string };
    dest_warehouse?: { id: number; name: string } | null;
    creator: { id: number; name: string };
    lines_count: number;
}

interface WarehouseFilter {
    id: number;
    name: string;
}

interface PaginatedMoves {
    data: MoveRow[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: {
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
        per_page: number;
    };
}

interface Props {
    moves: PaginatedMoves;
    warehouses: WarehouseFilter[];
    filters: { type?: string; status?: string; warehouse_id?: string; date_from?: string; date_to?: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

type MoveType = 'initial' | 'in' | 'out' | 'adjust' | 'transfer_in' | 'transfer_out';

const TYPE_FILTER_OPTIONS = [
    { value: '__all__',      label: 'Todos los tipos' },
    { value: 'in',          label: 'Recepciones'     },
    { value: 'out',         label: 'Salidas'         },
    { value: 'adjust',      label: 'Ajustes'         },
    { value: 'transfer_in', label: 'Traslados'       },
];

const MOVE_TYPE_MAP: Record<MoveType, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    initial:      { label: 'Carga Inicial',     variant: 'outline'     },
    in:           { label: 'Recepción',          variant: 'default'     },
    out:          { label: 'Salida',             variant: 'destructive' },
    adjust:       { label: 'Ajuste',             variant: 'secondary'   },
    transfer_in:  { label: 'Traslado (Entrada)', variant: 'outline'     },
    transfer_out: { label: 'Traslado (Salida)',  variant: 'outline'     },
};

function MoveBadge({ type }: { type: string }) {
    const t = type as MoveType;
    const info = MOVE_TYPE_MAP[t] ?? { label: type, variant: 'outline' as const };
    return <Badge variant={info.variant} className="text-[10px]">{info.label}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'draft') {
        return <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">Borrador</Badge>;
    }
    return <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Procesada</Badge>;
}

function fmtDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MovementsIndex({ moves, warehouses, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [statusFilter, setStatusFilter]       = useState(filters.status ?? 'confirmed');
    const [typeFilter, setTypeFilter]           = useState(filters.type ?? '__all__');
    const [warehouseId, setWarehouseId]         = useState(filters.warehouse_id ?? '__all__');
    const [dateFrom, setDateFrom]               = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]                   = useState(filters.date_to ?? '');

    function navigate(s: string, t: string, w: string, df: string, dt: string) {
        const p: Record<string, string> = { status: s };
        if (t && t !== '__all__') p.type         = t;
        if (w && w !== '__all__') p.warehouse_id = w;
        if (df) p.date_from = df;
        if (dt) p.date_to   = dt;
        router.get('/inventory/movements', p, { preserveState: true, replace: true });
    }

    function changeStatus(s: string) {
        setStatusFilter(s);
        navigate(s, typeFilter, warehouseId, dateFrom, dateTo);
    }

    function changeType(t: string) {
        setTypeFilter(t);
        navigate(statusFilter, t, warehouseId, dateFrom, dateTo);
    }

    function changeWarehouse(w: string) {
        setWarehouseId(w);
        navigate(statusFilter, typeFilter, w, dateFrom, dateTo);
    }

    const { data } = moves;
    
    // Normalization of meta for different paginator versions
    const meta = (moves as any).meta ?? {
        current_page: (moves as any).current_page ?? 1,
        last_page: (moves as any).last_page ?? 1,
        from: (moves as any).from ?? null,
        per_page: (moves as any).per_page ?? 50,
        to: (moves as any).to ?? null,
        total: (moves as any).total ?? data.length,
    };

    return (
        <>
            <Head title="Operaciones de Inventario" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight">Inventario</h1>
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Operaciones</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/inventory/movements/create?type=in">
                            <Button size="sm" className="gap-1.5 h-9">
                                <Plus className="h-4 w-4" />
                                <span>Nueva Operación</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                        {flash.success}
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <Tabs value={statusFilter} onValueChange={changeStatus} className="w-full">
                        <div className="flex items-center justify-between border-b pb-px">
                            <TabsList className="h-10 bg-transparent p-0 gap-6">
                                <TabsTrigger 
                                    value="draft" 
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-0 text-muted-foreground data-[state=active]:text-foreground"
                                >
                                    Borradores
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="confirmed" 
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-0 text-muted-foreground data-[state=active]:text-foreground"
                                >
                                    Procesadas
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="__all__" 
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-0 text-muted-foreground data-[state=active]:text-foreground"
                                >
                                    Todo
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </Tabs>

                    <Card>
                        <CardHeader className="pb-4 pt-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                                    <div className="relative flex-1 max-w-sm">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input 
                                            placeholder="Buscar referencia o notas..." 
                                            className="pl-9 h-9"
                                        />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-9 gap-1.5 focus-visible:ring-0">
                                                <ListFilter className="h-4 w-4" />
                                                <span>Tipo</span>
                                                {typeFilter !== '__all__' && (
                                                    <Badge variant="secondary" className="ml-0.5 h-4.5 rounded-full px-1.5 text-[10px] font-medium">1</Badge>
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-64">
                                            <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                Operación
                                            </DropdownMenuLabel>
                                            <DropdownMenuRadioGroup value={typeFilter} onValueChange={changeType}>
                                                {TYPE_FILTER_OPTIONS.map((opt) => (
                                                    <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-sm">
                                                        {opt.label}
                                                    </DropdownMenuRadioItem>
                                                ))}
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-9 gap-1.5 focus-visible:ring-0">
                                                <SlidersHorizontal className="h-4 w-4" />
                                                <span>Almacén</span>
                                                {warehouseId !== '__all__' && (
                                                    <Badge variant="secondary" className="ml-0.5 h-4.5 rounded-full px-1.5 text-[10px] font-medium">1</Badge>
                                                )}
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-64">
                                            <DropdownMenuRadioGroup value={warehouseId} onValueChange={changeWarehouse}>
                                                <DropdownMenuRadioItem value="__all__" className="text-sm">Todos los almacenes</DropdownMenuRadioItem>
                                                {warehouses.map((w) => (
                                                    <DropdownMenuRadioItem key={w.id} value={String(w.id)} className="text-sm">
                                                        {w.name}
                                                    </DropdownMenuRadioItem>
                                                ))}
                                            </DropdownMenuRadioGroup>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                                    Página {meta.current_page} de {meta.last_page} ({meta.total} registros)
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/30 text-left transition-colors text-muted-foreground font-medium uppercase text-[11px] tracking-wider">
                                            <th className="px-4 py-3 font-medium">Fecha</th>
                                            <th className="px-4 py-3 font-medium">Tipo</th>
                                            <th className="px-4 py-3 font-medium">Estado</th>
                                            <th className="px-4 py-3 font-medium">Documento / Ref.</th>
                                            <th className="px-4 py-3 font-medium">Almacén</th>
                                            <th className="px-4 py-3 font-medium text-right">Cant. Ítems</th>
                                            <th className="px-4 py-3 font-medium"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center text-muted-foreground italic">
                                                    No se encontraron movimientos con los filtros actuales.
                                                </td>
                                            </tr>
                                        ) : (
                                            data.map((move) => (
                                                <tr key={move.id} className="hover:bg-muted/30 transition-colors group">
                                                    <td className="px-4 py-3 font-medium">
                                                        {fmtDate(move.moved_at)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <MoveBadge type={move.type} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={move.status} />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {move.reference ? (
                                                            <div className="flex flex-col">
                                                                <span className="font-mono text-xs">{move.reference}</span>
                                                                {move.notes && (
                                                                    <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                                                        {move.notes}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span>{move.warehouse.name}</span>
                                                            {move.dest_warehouse && (
                                                                <span className="text-[10px] text-muted-foreground">
                                                                    → {move.dest_warehouse.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums">
                                                        {move.lines_count}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Link href={`/inventory/movements/${move.id}`}>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Simple Pagination */}
                    <div className="flex items-center justify-between mt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!moves.links[0]?.url}
                            onClick={() => moves.links[0]?.url && router.get(moves.links[0].url)}
                        >
                            <ChevronLeft className="mr-1.5 h-4 w-4" />
                            Anterior
                        </Button>
                        <div className="flex items-center gap-1">
                            {moves.links.filter(l => !l.label.includes('&laquo;') && !l.label.includes('&raquo;')).map((link, idx) => (
                                <Button
                                    key={idx}
                                    variant={link.active ? 'default' : 'ghost'}
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => link.url && router.get(link.url)}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!moves.links[moves.links.length - 1]?.url}
                            onClick={() => moves.links[moves.links.length - 1]?.url && router.get(moves.links[moves.links.length - 1].url)}
                        >
                            Siguiente
                            <ChevronRight className="ml-1.5 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

MovementsIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Inventario', href: '/inventory' },
        { title: 'Movimientos', href: '/inventory/movements' },
    ],
};
