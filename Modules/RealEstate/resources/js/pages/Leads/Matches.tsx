import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Building2, MapPin } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Leads', href: '/realestate/leads' },
    { title: 'Matching Automático', href: '/realestate/leads/matches' },
];

const fmt = (n?: string | null) => n ? Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 }) : '—';

interface MatchItem {
    lead: { id: number; reference: string; name: string; deal_type: string; preferred_zone?: string; budget_max?: string; status: string; agent?: { name: string } };
    properties: { id: number; reference: string; title: string; sale_price?: string; rent_price?: string; currency: string; zone?: string; city?: string; media: any[] }[];
}

export default function LeadsMatches({ matches }: { matches: MatchItem[] }) {
    return (
        <>
            <Head title="Matching Automático" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-xl font-semibold">Matching Automático de Leads</h1>
                <p className="text-sm text-muted-foreground">Leads activos y las propiedades que coinciden con su perfil de búsqueda.</p>

                {matches.length === 0
                    ? <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground"><Building2 className="h-10 w-10 opacity-40" /><p>No hay leads activos con propiedades coincidentes.</p></div>
                    : <div className="space-y-6">
                        {matches.map(({ lead, properties }) => (
                            <div key={lead.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
                                    <div>
                                        <span className="font-medium text-foreground">{lead.name}</span>
                                        <span className="ml-2 font-mono text-xs text-muted-foreground">{lead.reference}</span>
                                        {lead.preferred_zone && <span className="ml-2 text-xs text-muted-foreground">· {lead.preferred_zone}</span>}
                                        {lead.budget_max && <span className="ml-2 text-xs text-muted-foreground">· máx {fmt(lead.budget_max)}</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {lead.agent && <span className="text-xs text-muted-foreground">{lead.agent.name}</span>}
                                        <button onClick={() => router.visit(`/realestate/leads/${lead.id}`)}
                                            className="rounded border border-border px-2 py-0.5 text-xs hover:bg-accent transition-colors">Ver Lead</button>
                                    </div>
                                </div>
                                {properties.length === 0
                                    ? <p className="px-4 py-3 text-sm text-muted-foreground">Sin propiedades coincidentes disponibles.</p>
                                    : <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
                                        {properties.map((p) => {
                                            const photo = p.media.find((m: any) => m.type === 'photo');
                                            return (
                                                <div key={p.id} onClick={() => router.visit(`/realestate/properties/${p.id}`)}
                                                    className="cursor-pointer rounded-lg border border-border hover:shadow-md transition-all overflow-hidden">
                                                    <div className="h-28 bg-muted overflow-hidden">
                                                        {photo
                                                            ? <img src={`/storage/${photo.path}`} alt={p.title} className="h-full w-full object-cover" />
                                                            : <div className="flex h-full items-center justify-center"><Building2 className="h-8 w-8 opacity-20" /></div>}
                                                    </div>
                                                    <div className="p-2">
                                                        <p className="text-xs font-medium line-clamp-1 text-foreground">{p.title}</p>
                                                        {(p.zone || p.city) && (
                                                            <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                                                <MapPin className="h-2.5 w-2.5" />{[p.zone, p.city].filter(Boolean).join(', ')}
                                                            </p>
                                                        )}
                                                        <p className="mt-1 text-xs font-semibold text-primary">
                                                            {p.sale_price ? `${p.currency} ${fmt(p.sale_price)}` : `${p.currency} ${fmt(p.rent_price)}/mes`}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>}
                            </div>
                        ))}
                    </div>}
            </div>
        </>
    );
}

LeadsMatches.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
