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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ListFilter, Package, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProductRow {
    id: number;
    sku: string;
    name: string;
    description: string | null;
    type: 'storable' | 'service' | 'consumable';
    tracking: 'none' | 'lot' | 'serial';
    valuation: 'average' | 'fifo';
    cost: number;
    price: number;
    min_stock: number;
    active: boolean;
    category: { id: number; name: string } | null;
    uom: { id: number; name: string; abbreviation: string } | null;
    total_stock?: number;
    total_reserved?: number;
}

interface CategoryFilter {
    id: number;
    name: string;
}

interface PaginatedProducts {
    data: ProductRow[];
    links: { url: string | null; label: string; active: boolean }[];
    meta?: {
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
        per_page: number;
    };
    current_page?: number;
    last_page?: number;
    from?: number | null;
    to?: number | null;
    total?: number;
    per_page?: number;
}

interface Props {
    products: PaginatedProducts;
    categories: CategoryFilter[];
    filters: { search?: string; category_id?: string; type?: string; active?: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
    { value: '',            label: 'Todos'        },
    { value: 'storable',    label: 'Almacenable'  },
    { value: 'service',     label: 'Servicio'     },
    { value: 'consumable',  label: 'Consumible'   },
];

const ACTIVE_OPTIONS = [
    { value: '',  label: 'Todos'     },
    { value: '1', label: 'Activos'   },
    { value: '0', label: 'Inactivos' },
];

function typeBadge(type: ProductRow['type']) {
    const map: Record<ProductRow['type'], { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
        storable:   { label: 'Almacenable', variant: 'default'   },
        service:    { label: 'Servicio',    variant: 'secondary' },
        consumable: { label: 'Consumible',  variant: 'outline'   },
    };
    const { label, variant } = map[type] ?? { label: type, variant: 'outline' };
    return <Badge variant={variant} className="text-[10px]">{label}</Badge>;
}

function trackingBadge(tracking: ProductRow['tracking']) {
    if (tracking === 'none') return null;
    return (
        <Badge variant="outline" className="text-[10px]">
            {tracking === 'lot' ? 'Lotes' : 'Series'}
        </Badge>
    );
}

function fmtCurrency(n: number) {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2 }).format(n);
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProductsIndex({ products, categories, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [search, setSearch]           = useState(filters.search ?? '');
    const [typeFilter, setTypeFilter]   = useState(filters.type ?? '');
    const [activeFilter, setActiveFilter] = useState(filters.active ?? '');
    const [categoryId, setCategoryId]   = useState(filters.category_id ?? '__all__');
    const [deletingId, setDeletingId]   = useState<number | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            navigate(search, typeFilter, activeFilter, categoryId);
        }, 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function navigate(s: string, t: string, a: string, c: string) {
        const p: Record<string, string> = {};
        if (s) p.search = s;
        if (t) p.type   = t;
        if (a) p.active = a;
        if (c && c !== '__all__') p.category_id = c;
        router.get('/inventory/products', p, { preserveState: true, replace: true });
    }

    function changeType(t: string) {
        setTypeFilter(t);
        navigate(search, t, activeFilter, categoryId);
    }

    function changeActive(a: string) {
        setActiveFilter(a);
        navigate(search, typeFilter, a, categoryId);
    }

    function changeCategory(c: string) {
        setCategoryId(c);
        navigate(search, typeFilter, activeFilter, c);
    }

    function deleteProduct(p: ProductRow) {
        if (!confirm(`¿Eliminar el producto "${p.name}"? Esta acción no se puede deshacer.`)) return;
        setDeletingId(p.id);
        router.delete(`/inventory/products/${p.id}`, { onFinish: () => setDeletingId(null) });
    }

    const { data } = products;
    const meta = products.meta ?? {
        current_page: products.current_page ?? 1,
        last_page: products.last_page ?? 1,
        from: products.from ?? null,
        to: products.to ?? null,
        total: products.total ?? data.length,
        per_page: products.per_page ?? 50,
    };

    return (
        <>
            <Head title="Productos" />

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
                            <div className="flex w-full max-w-md items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por nombre o SKU…"
                                        className="h-9 pl-9 pr-8 text-sm"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    {search && (
                                        <button
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => setSearch('')}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-9 gap-1.5 focus-visible:ring-0">
                                            <ListFilter className="h-4 w-4" />
                                            <span>Filtros</span>
                                            {(categoryId !== '__all__' || typeFilter !== '' || activeFilter !== '') && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-0.5 h-4.5 rounded-full px-1.5 text-[10px] font-medium"
                                                >
                                                    {(categoryId !== '__all__' ? 1 : 0) + (typeFilter !== '' ? 1 : 0) + (activeFilter !== '' ? 1 : 0)}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64">
                                        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Categoría
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={categoryId} onValueChange={changeCategory}>
                                            <DropdownMenuRadioItem value="__all__" className="text-sm">
                                                Todas las categorías
                                            </DropdownMenuRadioItem>
                                            {categories.map((c) => (
                                                <DropdownMenuRadioItem key={c.id} value={String(c.id)} className="text-sm">
                                                    {c.name}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Tipo de Producto
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={typeFilter} onValueChange={changeType}>
                                            {TYPE_OPTIONS.map((opt) => (
                                                <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-sm">
                                                    {opt.label}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Estado
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={activeFilter} onValueChange={changeActive}>
                                            {ACTIVE_OPTIONS.map((opt) => (
                                                <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-sm">
                                                    {opt.label}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-3 ml-auto">
                                {meta.total > 0 && (
                                    <span className="hidden text-xs text-muted-foreground sm:inline-block">
                                        {meta.total} {meta.total === 1 ? 'producto' : 'productos'}
                                    </span>
                                )}
                                <Link href="/inventory/products/create">
                                    <Button size="sm" className="flex items-center gap-1.5 h-9">
                                        <Plus className="h-4 w-4" />
                                        Nuevo Producto
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <Package className="h-8 w-8 opacity-40" />
                                <p className="text-sm">
                                    {search || typeFilter || activeFilter || categoryId !== '__all__'
                                        ? 'No se encontraron productos con esos filtros.'
                                        : 'Aún no hay productos. Crea el primero.'}
                                </p>
                                {!search && !typeFilter && !activeFilter && categoryId === '__all__' && (
                                    <Link href="/inventory/products/create">
                                        <Button variant="outline" size="sm">Crear producto</Button>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="pb-2 pr-3 font-medium">SKU</th>
                                                <th className="pb-2 pr-3 font-medium">Nombre</th>
                                                <th className="pb-2 pr-3 font-medium">Categoría</th>
                                                <th className="pb-2 pr-3 font-medium">Tipo</th>
                                                <th className="pb-2 pr-3 font-medium">Método</th>
                                                <th className="pb-2 pr-3 font-medium">UoM</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Costo</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Precio</th>
                                                <th className="pb-2 pr-3 font-medium text-right text-muted-foreground">Físico</th>
                                                <th className="pb-2 pr-3 font-medium text-right text-primary">Disponible</th>
                                                <th className="pb-2 pr-3 font-medium">Estado</th>
                                                <th className="pb-2 pr-3 font-medium">Editar</th>
                                                <th className="pb-2 font-medium">Eliminar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((p) => (
                                                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">{p.sku}</td>
                                                    <td className="py-2 pr-3">
                                                        <Link
                                                            href={`/inventory/products/${p.id}/edit`}
                                                            className="font-medium hover:text-primary hover:underline"
                                                        >
                                                            {p.name}
                                                        </Link>
                                                    </td>
                                                    <td className="py-2 pr-3 text-xs text-muted-foreground">{p.category?.name ?? '—'}</td>
                                                    <td className="py-2 pr-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {typeBadge(p.type)}
                                                            {trackingBadge(p.tracking)}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                                                        {p.valuation === 'average' ? 'Promedio' : 'FIFO'}
                                                    </td>
                                                    <td className="py-2 pr-3 text-xs text-muted-foreground">{p.uom?.abbreviation ?? '—'}</td>
                                                    <td className="py-2 pr-3 text-right text-xs tabular-nums">{fmtCurrency(p.cost)}</td>
                                                    <td className="py-2 pr-3 text-right text-xs tabular-nums">{fmtCurrency(p.price)}</td>
                                                    <td className="py-2 pr-3 text-right text-xs tabular-nums text-muted-foreground">
                                                        {p.type === 'service' ? '—' : (p.total_stock ?? 0)}
                                                    </td>
                                                    <td className="py-2 pr-3 text-right text-xs tabular-nums font-bold text-primary">
                                                        {p.type === 'service' ? '—' : ((p.total_stock ?? 0) - (p.total_reserved ?? 0))}
                                                    </td>
                                                    <td className="py-2 pr-3">
                                                        <Badge variant={p.active ? 'secondary' : 'outline'}>
                                                            {p.active ? 'Activo' : 'Inactivo'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2 pr-3">
                                                        <Link href={`/inventory/products/${p.id}/edit`}>
                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                    <td className="py-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                            disabled={deletingId === p.id}
                                                            onClick={() => deleteProduct(p)}
                                                        >
                                                            {deletingId === p.id
                                                                ? <Spinner className="h-3 w-3" />
                                                                : <Trash2 className="h-3.5 w-3.5" />}
                                                        </Button>
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
                                            {products.links.map((link, i) => {
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

ProductsIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Inventario', href: '/inventory' },
        { title: 'Productos', href: '/inventory/products' },
    ],
};
