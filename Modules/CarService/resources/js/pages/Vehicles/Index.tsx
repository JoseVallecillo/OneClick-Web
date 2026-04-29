import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Car, ChevronLeft, ChevronRight, Pencil, Plus, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Vehicle {
    id: number; plate: string; vin: string | null;
    make: string; model: string; year: number | null; color: string | null;
    last_odometer: number; active: boolean;
    customer: { id: number; name: string } | null;
}

interface Paginated {
    data: Vehicle[];
    links: { url: string | null; label: string; active: boolean }[];
    meta?: { current_page: number; last_page: number; from: number | null; to: number | null; total: number; per_page: number };
    current_page?: number;
    last_page?: number;
    from?: number | null;
    to?: number | null;
    total?: number;
    per_page?: number;
}

function fmtKm(n: number) { return n > 0 ? n.toLocaleString('es-HN') + ' km' : '—'; }

export default function VehiclesIndex({ vehicles, filters }: { vehicles: Paginated; filters: { search?: string } }) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const flash = props.flash;
    const [search, setSearch] = useState(filters.search ?? '');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            router.get('/carservice/vehicles', search ? { search } : {}, { preserveState: true, replace: true });
        }, 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const { data } = vehicles;
    const meta = vehicles.meta ?? {
        current_page: vehicles.current_page ?? 1,
        last_page: vehicles.last_page ?? 1,
        from: vehicles.from ?? null,
        per_page: vehicles.per_page ?? 50,
        to: vehicles.to ?? null,
        total: vehicles.total ?? data.length,
    };

    return (
        <>
            <Head title="Vehículos" />
            <div className="flex flex-col gap-6 p-4">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>
                )}

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar placa, marca, modelo…"
                                    className="h-9 pl-9 pr-8 text-sm"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                {search && (
                                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')}>
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-3 ml-auto">
                                {meta.total > 0 && (
                                    <span className="hidden text-xs text-muted-foreground sm:inline-block">{meta.total} vehículos</span>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <Car className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No hay vehículos registrados.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground text-xs">
                                                <th className="pb-2 pr-3 font-medium">Placa</th>
                                                <th className="pb-2 pr-3 font-medium">Vehículo</th>
                                                <th className="pb-2 pr-3 font-medium">Cliente</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Último km</th>
                                                <th className="pb-2 font-medium">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map(v => (
                                                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="py-2 pr-3 font-mono font-bold text-xs">{v.plate}</td>
                                                    <td className="py-2 pr-3 text-xs">
                                                        {v.make} {v.model}
                                                        {v.year && <span className="ml-1 text-muted-foreground">({v.year})</span>}
                                                        {v.color && <Badge variant="outline" className="ml-2 text-[9px]">{v.color}</Badge>}
                                                    </td>
                                                    <td className="py-2 pr-3 text-xs">{v.customer?.name ?? <span className="text-muted-foreground">—</span>}</td>
                                                    <td className="py-2 pr-3 text-right text-xs tabular-nums">{fmtKm(v.last_odometer)}</td>
                                                    <td className="py-2">
                                                        <Link href={`/carservice/vehicles/${v.id}/edit`}>
                                                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                                                <Pencil className="h-3 w-3" /> Editar
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {meta.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
                                        <span className="text-xs text-muted-foreground">{meta.from}–{meta.to} de {meta.total}</span>
                                        <div className="flex gap-1">
                                            {vehicles.links.map((link, i) => {
                                                if (link.label === '&laquo; Previous')
                                                    return <Button key={i} variant="outline" size="sm" className="h-7 w-7 p-0" disabled={!link.url} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}><ChevronLeft className="h-3.5 w-3.5" /></Button>;
                                                if (link.label === 'Next &raquo;')
                                                    return <Button key={i} variant="outline" size="sm" className="h-7 w-7 p-0" disabled={!link.url} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}><ChevronRight className="h-3.5 w-3.5" /></Button>;
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

VehiclesIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Lubricentro', href: '/carservice/orders' },
        { title: 'Vehículos', href: '/carservice/vehicles' },
    ],
};
