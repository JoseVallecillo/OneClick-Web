import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Clock, Pencil, Plus, Scissors, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface CategoryOption { id: number; name: string; color: string; }
interface ServiceRow {
    id: number; name: string; description: string | null; duration_minutes: number;
    price: number; commission_rate: number; active: boolean;
    category: CategoryOption | null;
}
interface PaginatedServices {
    data: ServiceRow[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page?: number; last_page?: number; from?: number | null; to?: number | null; total?: number;
    meta?: { current_page: number; last_page: number; from: number | null; to: number | null; total: number };
}
interface Props { services: PaginatedServices; categories: CategoryOption[]; filters: { search?: string; category_id?: string; active?: string }; }

function fmtCurrency(n: number) {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2 }).format(n);
}

export default function ServicesIndex({ services, categories, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [search, setSearch]         = useState(filters.search ?? '');
    const [categoryId, setCategoryId] = useState(filters.category_id ?? '');
    const [activeFilter, setActiveFilter] = useState(filters.active ?? '');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => navigate(search, categoryId, activeFilter), 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function navigate(s: string, c: string, a: string) {
        const p: Record<string, string> = {};
        if (s) p.search = s;
        if (c) p.category_id = c;
        if (a) p.active = a;
        router.get('/barbershop/services', p, { preserveState: true, replace: true });
    }

    function del(svc: ServiceRow) {
        if (!confirm(`¿Eliminar el servicio "${svc.name}"? Esta acción no se puede deshacer.`)) return;
        setDeletingId(svc.id);
        router.delete(`/barbershop/services/${svc.id}`, { onFinish: () => setDeletingId(null) });
    }

    const { data } = services;
    const meta = services.meta ?? { current_page: services.current_page ?? 1, last_page: services.last_page ?? 1, from: services.from ?? null, to: services.to ?? null, total: services.total ?? data.length };

    return (
        <>
            <Head title="Servicios" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">{flash.success}</div>}
                {flash?.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{flash.error}</div>}

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[160px]">
                                <Input placeholder="Buscar servicio…" className="h-9 pl-4 pr-8 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
                                {search && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')}><X className="h-3.5 w-3.5" /></button>}
                            </div>
                            <Select value={categoryId || '__all__'} onValueChange={v => { const c = v === '__all__' ? '' : v; setCategoryId(c); navigate(search, c, activeFilter); }}>
                                <SelectTrigger className="h-9 w-44 text-sm"><SelectValue placeholder="Categoría" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Todas las categorías</SelectItem>
                                    {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={activeFilter || '__all__'} onValueChange={v => { const a = v === '__all__' ? '' : v; setActiveFilter(a); navigate(search, categoryId, a); }}>
                                <SelectTrigger className="h-9 w-32 text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Todos</SelectItem>
                                    <SelectItem value="1">Activos</SelectItem>
                                    <SelectItem value="0">Inactivos</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="ml-auto flex items-center gap-3">
                                {meta.total > 0 && <span className="hidden text-xs text-muted-foreground sm:inline">{meta.total} servicios</span>}
                                <Link href="/barbershop/services/create">
                                    <Button size="sm" className="h-9 gap-1.5"><Plus className="h-4 w-4" />Nuevo Servicio</Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <Scissors className="h-8 w-8 opacity-30" />
                                <p className="text-sm">No se encontraron servicios.</p>
                                <Link href="/barbershop/services/create"><Button variant="outline" size="sm">Nuevo servicio</Button></Link>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="pb-2 pr-3 font-medium">Servicio</th>
                                                <th className="pb-2 pr-3 font-medium">Categoría</th>
                                                <th className="pb-2 pr-3 font-medium">Duración</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Precio</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Comisión</th>
                                                <th className="pb-2 pr-3 font-medium">Estado</th>
                                                <th className="pb-2 pr-3 font-medium">Editar</th>
                                                <th className="pb-2 font-medium">Eliminar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map(svc => (
                                                <tr key={svc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="py-2 pr-3">
                                                        <div>
                                                            <Link href={`/barbershop/services/${svc.id}/edit`} className="font-medium hover:text-primary hover:underline">{svc.name}</Link>
                                                            {svc.description && <p className="text-xs text-muted-foreground line-clamp-1">{svc.description}</p>}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 pr-3">
                                                        {svc.category ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: svc.category.color }} />
                                                                <span className="text-xs">{svc.category.name}</span>
                                                            </div>
                                                        ) : <span className="text-xs text-muted-foreground">—</span>}
                                                    </td>
                                                    <td className="py-2 pr-3">
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                                            {svc.duration_minutes} min
                                                        </div>
                                                    </td>
                                                    <td className="py-2 pr-3 text-right text-xs font-semibold tabular-nums">{fmtCurrency(svc.price)}</td>
                                                    <td className="py-2 pr-3 text-right text-xs tabular-nums">{svc.commission_rate}%</td>
                                                    <td className="py-2 pr-3">
                                                        <Badge variant={svc.active ? 'secondary' : 'outline'} className="text-[10px]">{svc.active ? 'Activo' : 'Inactivo'}</Badge>
                                                    </td>
                                                    <td className="py-2 pr-3">
                                                        <Link href={`/barbershop/services/${svc.id}/edit`}>
                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
                                                        </Link>
                                                    </td>
                                                    <td className="py-2">
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" disabled={deletingId === svc.id} onClick={() => del(svc)}>
                                                            {deletingId === svc.id ? <Spinner className="h-3 w-3" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {(meta.last_page ?? 1) > 1 && (
                                    <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
                                        <span className="text-xs text-muted-foreground">{meta.from}–{meta.to} de {meta.total}</span>
                                        <div className="flex items-center gap-1">
                                            {services.links.map((link, i) => {
                                                if (link.label === '&laquo; Previous') return <Button key={i} variant="outline" size="sm" className="h-7 w-7 p-0" disabled={!link.url} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}><ChevronLeft className="h-3.5 w-3.5" /></Button>;
                                                if (link.label === 'Next &raquo;') return <Button key={i} variant="outline" size="sm" className="h-7 w-7 p-0" disabled={!link.url} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}><ChevronRight className="h-3.5 w-3.5" /></Button>;
                                                return <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm" className="h-7 min-w-[28px] px-2 text-xs" disabled={!link.url || link.active} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })} dangerouslySetInnerHTML={{ __html: link.label }} />;
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

ServicesIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Barbería', href: '/barbershop' },
        { title: 'Servicios', href: '/barbershop/services' },
    ],
};
