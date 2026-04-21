import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Building2, MapPin, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Propiedades', href: '/realestate/properties' }];

const TYPE_LABELS: Record<string, string> = {
    apartment: 'Apartamento', house: 'Casa', land: 'Terreno',
    commercial: 'Comercial', office: 'Oficina', warehouse: 'Bodega',
};
const STATUS_LABELS: Record<string, string> = {
    available: 'Disponible', reserved: 'Reservado', sold: 'Vendido',
    rented: 'Arrendado', maintenance: 'Mantenimiento', inactive: 'Inactivo',
};
const STATUS_COLORS: Record<string, string> = {
    available:   'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    reserved:    'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    sold:        'bg-muted text-muted-foreground',
    rented:      'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    maintenance: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    inactive:    'bg-secondary text-secondary-foreground',
};

const fmt = (n?: string | number | null) =>
    n != null ? Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';

interface Property {
    id: number; reference: string; type: string; status: string;
    title: string; city?: string; zone?: string;
    bedrooms: number; bathrooms: number; land_area?: string; build_area?: string;
    sale_price?: string; rent_price?: string; currency: string;
    deals_count: number;
    agent?: { name: string };
    media: { path: string; is_main: boolean; type: string }[];
}

interface Props {
    properties: { data: Property[]; links: any[]; meta: any };
    filters: Record<string, string>;
}

export default function PropertiesIndex({ properties, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType]     = useState(filters.type ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const navigate = useCallback((overrides: Record<string, string>) => {
        router.get('/realestate/properties', { search, type, status, ...filters, ...overrides }, { preserveState: true, replace: true });
    }, [search, type, status, filters]);

    return (
        <>
            <Head title="Propiedades" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Propiedades</h1>
                    <Button size="sm" onClick={() => router.visit('/realestate/properties/create')}>
                        <Plus className="mr-1 h-4 w-4" />Nueva Propiedad
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <Input placeholder="Referencia, título, zona..." className="w-56"
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && navigate({ search })} />
                    <Select value={type || '_all'} onValueChange={(v) => { const val = v === '_all' ? '' : v; setType(val); navigate({ type: val }); }}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Todos los tipos</SelectItem>
                            {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={status || '_all'} onValueChange={(v) => { const val = v === '_all' ? '' : v; setStatus(val); navigate({ status: val }); }}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Todos</SelectItem>
                            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => navigate({ search })}>Filtrar</Button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {properties.data.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
                            <Building2 className="h-10 w-10" />
                            <p>No hay propiedades que coincidan.</p>
                        </div>
                    ) : properties.data.map((p) => {
                        const mainPhoto = p.media.find((m) => m.is_main && m.type === 'photo') ?? p.media.find((m) => m.type === 'photo');
                        return (
                            <div key={p.id} onClick={() => router.visit(`/realestate/properties/${p.id}`)}
                                className="cursor-pointer rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden">
                                {/* Photo */}
                                <div className="h-40 bg-muted overflow-hidden">
                                    {mainPhoto
                                        ? <img src={`/storage/${mainPhoto.path}`} alt={p.title} className="h-full w-full object-cover" />
                                        : <div className="flex h-full items-center justify-center text-muted-foreground"><Building2 className="h-12 w-12 opacity-30" /></div>}
                                </div>
                                <div className="p-3">
                                    <div className="flex items-start justify-between gap-1">
                                        <div>
                                            <p className="font-medium text-sm text-foreground line-clamp-1">{p.title}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{p.reference}</p>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[p.status]}`}>
                                            {STATUS_LABELS[p.status]}
                                        </span>
                                    </div>
                                    {(p.city || p.zone) && (
                                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3 shrink-0" />
                                            <span className="line-clamp-1">{[p.zone, p.city].filter(Boolean).join(', ')}</span>
                                        </div>
                                    )}
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">{TYPE_LABELS[p.type]}{p.bedrooms > 0 ? ` · ${p.bedrooms}H` : ''}{p.bathrooms > 0 ? ` · ${p.bathrooms}B` : ''}</span>
                                    </div>
                                    <div className="mt-1">
                                        {p.sale_price && <p className="text-sm font-semibold text-primary">{p.currency} {fmt(p.sale_price)}</p>}
                                        {p.rent_price && <p className="text-xs text-muted-foreground">{p.currency} {fmt(p.rent_price)}/mes</p>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {properties.links && (
                    <div className="flex justify-center gap-1">
                        {properties.links.map((link: any, i: number) => (
                            <button key={i} disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-accent text-muted-foreground'} disabled:opacity-40`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

PropertiesIndex.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
