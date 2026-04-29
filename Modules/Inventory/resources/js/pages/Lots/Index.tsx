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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { Head, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Layers, ListFilter } from 'lucide-react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface LotRow {
    id: number;
    lot_number: string;
    qty_available: number;
    unit_cost: number;
    received_at: string;
    expiration_date: string | null;
    notes: string | null;
    product: { id: number; sku: string; name: string; tracking: 'lot' | 'serial' };
    warehouse: { id: number; name: string };
}

interface ProductFilter {
    id: number;
    sku: string;
    name: string;
    tracking: string;
}

interface WarehouseFilter {
    id: number;
    name: string;
}

interface PaginatedLots {
    data: LotRow[];
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
    lots: PaginatedLots;
    products: ProductFilter[];
    warehouses: WarehouseFilter[];
    filters: { product_id?: string; warehouse_id?: string; expiring_days?: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const EXPIRING_OPTIONS = [
    { value: '__all__', label: 'Todos'             },
    { value: '7',       label: 'Vencen en 7 días'  },
    { value: '30',      label: 'Vencen en 30 días' },
    { value: '90',      label: 'Vencen en 90 días' },
];

function fmtDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function fmtCurrency(n: number) {
    return new Intl.NumberFormat('es-HN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(n);
}

function ExpirationCell({ dateStr }: { dateStr: string | null }) {
    if (!dateStr) return <span className="text-muted-foreground text-xs">—</span>;

    const exp = new Date(dateStr);
    const now = new Date();
    const diffMs = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let className = 'text-xs';
    if (diffDays < 0) {
        className = 'text-xs font-semibold text-red-600 dark:text-red-400';
    } else if (diffDays <= 30) {
        className = 'text-xs font-medium text-yellow-600 dark:text-yellow-400';
    }

    return <span className={className}>{fmtDate(dateStr)}</span>;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LotsIndex({ lots, products, warehouses, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [productId, setProductId]       = useState(filters.product_id ?? '__all__');
    const [warehouseId, setWarehouseId]   = useState(filters.warehouse_id ?? '__all__');
    const [expiringDays, setExpiringDays] = useState(filters.expiring_days ? filters.expiring_days : '__all__');

    function navigate(p: string, w: string, e: string) {
        const params: Record<string, string> = {};
        if (p && p !== '__all__') params.product_id   = p;
        if (w && w !== '__all__') params.warehouse_id = w;
        if (e && e !== '__all__') params.expiring_days = e;
        router.get('/inventory/lots', params, { preserveState: true, replace: true });
    }

    function changeProduct(v: string) {
        setProductId(v);
        navigate(v, warehouseId, expiringDays);
    }

    function changeWarehouse(v: string) {
        setWarehouseId(v);
        navigate(productId, v, expiringDays);
    }

    function changeExpiring(v: string) {
        setExpiringDays(v);
        navigate(productId, warehouseId, v);
    }

    const { data } = lots;
    const meta = lots.meta ?? {
        current_page: lots.current_page ?? 1,
        last_page: lots.last_page ?? 1,
        from: lots.from ?? null,
        per_page: lots.per_page ?? 50,
        to: lots.to ?? null,
        total: lots.total ?? data.length,
    };

    return (
        <>
            <Head title="Lotes y Series" />

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

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <h2 className="text-base font-semibold">Lotes y Series</h2>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-9 gap-1.5 focus-visible:ring-0">
                                            <ListFilter className="h-4 w-4" />
                                            <span>Filtros</span>
                                            {(productId !== '__all__' || warehouseId !== '__all__' || expiringDays !== '__all__') && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-0.5 h-4.5 rounded-full px-1.5 text-[10px] font-medium"
                                                >
                                                    {(productId !== '__all__' ? 1 : 0) + (warehouseId !== '__all__' ? 1 : 0) + (expiringDays !== '__all__' ? 1 : 0)}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-64">
                                        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Producto
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={productId} onValueChange={changeProduct}>
                                            <DropdownMenuRadioItem value="__all__" className="text-sm">
                                                Todos los productos
                                            </DropdownMenuRadioItem>
                                            {products.map((p) => (
                                                <DropdownMenuRadioItem key={p.id} value={String(p.id)} className="text-sm">
                                                    {p.sku} — {p.name}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Almacén
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={warehouseId} onValueChange={changeWarehouse}>
                                            <DropdownMenuRadioItem value="__all__" className="text-sm">
                                                Todos los almacenes
                                            </DropdownMenuRadioItem>
                                            {warehouses.map((w) => (
                                                <DropdownMenuRadioItem key={w.id} value={String(w.id)} className="text-sm">
                                                    {w.name}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Vencimiento
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={expiringDays} onValueChange={changeExpiring}>
                                            {EXPIRING_OPTIONS.map((opt) => (
                                                <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-sm">
                                                    {opt.label}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {meta.total > 0 && (
                                <div className="text-right">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                        {meta.total} {meta.total === 1 ? 'registro' : 'registros encontrados'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <Layers className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No se encontraron lotes con esos filtros.</p>
                                <p className="text-xs">Los lotes se generan automáticamente al registrar movimientos de inventario.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="pb-2 pr-3 font-medium">Producto</th>
                                                <th className="pb-2 pr-3 font-medium">Lote / Serie</th>
                                                <th className="pb-2 pr-3 font-medium">Almacén</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Disponible</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Costo Unit.</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Valor Total</th>
                                                <th className="pb-2 pr-3 font-medium">Recibido</th>
                                                <th className="pb-2 pr-3 font-medium">Vencimiento</th>
                                                <th className="pb-2 font-medium">Tipo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((lot) => (
                                                <tr key={lot.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="py-2 pr-3">
                                                        <div className="font-medium">{lot.product.name}</div>
                                                        <div className="text-[10px] font-mono text-muted-foreground">{lot.product.sku}</div>
                                                    </td>
                                                    <td className="py-2 pr-3 font-mono text-xs">{lot.lot_number}</td>
                                                    <td className="py-2 pr-3 text-xs text-muted-foreground">{lot.warehouse.name}</td>
                                                    <td className="py-2 pr-3 text-right tabular-nums text-xs">
                                                        {fmtCurrency(lot.qty_available)}
                                                    </td>
                                                    <td className="py-2 pr-3 text-right tabular-nums text-xs">
                                                        {fmtCurrency(lot.unit_cost)}
                                                    </td>
                                                    <td className="py-2 pr-3 text-right tabular-nums text-xs font-medium">
                                                        {fmtCurrency(lot.qty_available * lot.unit_cost)}
                                                    </td>
                                                    <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                                                        {fmtDate(lot.received_at)}
                                                    </td>
                                                    <td className="py-2 pr-3 whitespace-nowrap">
                                                        <ExpirationCell dateStr={lot.expiration_date} />
                                                    </td>
                                                    <td className="py-2">
                                                        <Badge variant="outline" className="text-[10px]">
                                                            {lot.product.tracking === 'serial' ? 'Serie' : 'Lote'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {meta.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
                                        <span className="text-xs text-muted-foreground">
                                            {meta.from}–{meta.to} de {meta.total}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {lots.links.map((link, i) => {
                                                if (link.label === '&laquo; Previous') {
                                                    return (
                                                        <Button
                                                            key={i}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            disabled={!link.url}
                                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                        >
                                                            <ChevronLeft className="h-3.5 w-3.5" />
                                                        </Button>
                                                    );
                                                }
                                                if (link.label === 'Next &raquo;') {
                                                    return (
                                                        <Button
                                                            key={i}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            disabled={!link.url}
                                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                        >
                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                        </Button>
                                                    );
                                                }
                                                return (
                                                    <Button
                                                        key={i}
                                                        variant={link.active ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="h-7 min-w-[28px] px-2 text-xs"
                                                        disabled={!link.url || link.active}
                                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
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

LotsIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Inventario', href: '/inventory' },
        { title: 'Lotes y Series', href: '/inventory/lots' },
    ],
};
