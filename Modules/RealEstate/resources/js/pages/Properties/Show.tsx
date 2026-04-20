import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, CheckCircle2, MapPin, Wrench } from 'lucide-react';

const TYPE_LABELS: Record<string,string> = { apartment:'Apartamento', house:'Casa', land:'Terreno', commercial:'Comercial', office:'Oficina', warehouse:'Bodega' };
const STATUS_LABELS: Record<string,string> = { available:'Disponible', reserved:'Reservado', sold:'Vendido', rented:'Arrendado', maintenance:'Mantenimiento', inactive:'Inactivo' };
const STATUS_COLORS: Record<string,string> = {
    available:'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    reserved:'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    sold:'bg-muted text-muted-foreground',
    rented:'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    maintenance:'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    inactive:'bg-secondary text-secondary-foreground',
};

const fmt = (n?: string | null) => n ? Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 }) : '—';

interface Media { id: number; path: string; type: string; is_main: boolean; caption?: string }
interface Deal { id: number; reference: string; status: string; deal_type: string; contact: { name: string } }
interface Property {
    id: number; reference: string; type: string; status: string; title: string; description?: string;
    address?: string; city?: string; zone?: string; department?: string; latitude?: string; longitude?: string;
    land_area?: string; build_area?: string; bedrooms: number; bathrooms: number; parking_spots: number; floors: number; soil_type?: string;
    has_water: boolean; has_electricity: boolean; has_gas: boolean; has_internet: boolean; has_sewage: boolean;
    sale_price?: string; rent_price?: string; currency: string; notes?: string;
    agent?: { name: string }; creator: { name: string };
    media: Media[]; deals: Deal[];
}

export default function PropertyShow({ property }: { property: Property }) {
    const photos = property.media.filter((m) => m.type === 'photo');
    const mainPhoto = photos.find((m) => m.is_main) ?? photos[0];

    const { post: doDelete, processing } = useForm();
    const handleDelete = () => {
        if (confirm('¿Eliminar esta propiedad? Esta acción no se puede deshacer.')) {
            doDelete(`/realestate/properties/${property.id}`, { method: 'delete' });
        }
    };

    const svc = (label: string, val: boolean) => (
        <span className={`flex items-center gap-1 text-xs ${val ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/40 line-through'}`}>
            <CheckCircle2 className={`h-3 w-3 ${val ? '' : 'opacity-30'}`} />{label}
        </span>
    );

    return (
        <>
            <Head title={property.title} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.visit('/realestate/properties')} className="rounded p-1 hover:bg-muted transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold">{property.title}</h1>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[property.status]}`}>{STATUS_LABELS[property.status]}</span>
                            </div>
                            <p className="text-sm font-mono text-muted-foreground">{property.reference} · {TYPE_LABELS[property.type]}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => router.visit(`/realestate/properties/${property.id}/edit`)}
                            className="rounded border border-border bg-card px-3 py-1.5 text-sm hover:bg-accent transition-colors">Editar</button>
                        <button onClick={handleDelete} disabled={processing}
                            className="rounded border border-destructive/20 bg-destructive/5 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors">Eliminar</button>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-4">
                        {/* Photos */}
                        {photos.length > 0 && (
                            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                                <img src={`/storage/${mainPhoto.path}`} alt={property.title} className="h-64 w-full object-cover" />
                                {photos.length > 1 && (
                                    <div className="flex gap-2 overflow-x-auto p-2">
                                        {photos.map((m) => (
                                            <img key={m.id} src={`/storage/${m.path}`} alt="" className="h-16 w-16 shrink-0 rounded object-cover cursor-pointer opacity-80 hover:opacity-100" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Details */}
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Detalles</h2>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                {property.address && (
                                    <div className="col-span-2 flex items-center gap-1 text-muted-foreground">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        <span>{[property.address, property.zone, property.city, property.department].filter(Boolean).join(', ')}</span>
                                    </div>
                                )}
                                {property.land_area && <div><span className="text-muted-foreground">m² Terreno:</span> <span className="font-medium">{property.land_area}</span></div>}
                                {property.build_area && <div><span className="text-muted-foreground">m² Construc.:</span> <span className="font-medium">{property.build_area}</span></div>}
                                {property.bedrooms > 0 && <div><span className="text-muted-foreground">Dormitorios:</span> <span className="font-medium">{property.bedrooms}</span></div>}
                                {property.bathrooms > 0 && <div><span className="text-muted-foreground">Baños:</span> <span className="font-medium">{property.bathrooms}</span></div>}
                                {property.parking_spots > 0 && <div><span className="text-muted-foreground">Parqueos:</span> <span className="font-medium">{property.parking_spots}</span></div>}
                                <div><span className="text-muted-foreground">Pisos:</span> <span className="font-medium">{property.floors}</span></div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-3">
                                {svc('Agua', property.has_water)}
                                {svc('Electricidad', property.has_electricity)}
                                {svc('Gas', property.has_gas)}
                                {svc('Internet', property.has_internet)}
                                {svc('Alcantarillado', property.has_sewage)}
                            </div>
                        </div>

                        {property.description && (
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                <h2 className="mb-2 font-medium">Descripción</h2>
                                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{property.description}</p>
                            </div>
                        )}

                        {/* Deals */}
                        {property.deals.length > 0 && (
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                <h2 className="mb-3 font-medium">Negocios Asociados</h2>
                                <div className="space-y-2">
                                    {property.deals.map((d) => (
                                        <div key={d.id} onClick={() => router.visit(`/realestate/deals/${d.id}`)}
                                            className="flex cursor-pointer items-center justify-between rounded border border-border p-2 hover:bg-muted/30 transition-colors">
                                            <div>
                                                <span className="font-mono text-sm font-medium">{d.reference}</span>
                                                <span className="ml-2 text-sm text-muted-foreground">{d.contact.name}</span>
                                            </div>
                                            <span className="text-xs capitalize text-muted-foreground">{d.deal_type === 'sale' ? 'Venta' : 'Renta'} · {d.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 text-sm font-medium">Precios</h2>
                            {property.sale_price && (
                                <div className="mb-1">
                                    <p className="text-xs text-muted-foreground">Precio Venta</p>
                                    <p className="text-lg font-bold text-primary">{property.currency} {fmt(property.sale_price)}</p>
                                </div>
                            )}
                            {property.rent_price && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Precio Renta/mes</p>
                                    <p className="text-base font-semibold">{property.currency} {fmt(property.rent_price)}</p>
                                </div>
                            )}
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-2 text-sm font-medium">Asignación</h2>
                            <p className="text-sm"><span className="text-muted-foreground">Agente:</span> {property.agent?.name ?? '—'}</p>
                            <p className="text-sm"><span className="text-muted-foreground">Creado por:</span> {property.creator.name}</p>
                        </div>

                        <button onClick={() => router.visit(`/realestate/deals/create?property_id=${property.id}`)}
                            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                            + Crear Negocio
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

PropertyShow.layout = (page: React.ReactNode) => {
    const p = (page as any).props.property;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Propiedades', href: '/realestate/properties' },
        { title: p.reference, href: `/realestate/properties/${p.id}` },
    ];
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
