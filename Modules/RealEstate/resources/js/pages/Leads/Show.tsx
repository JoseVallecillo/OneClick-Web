import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Calendar, Mail, MapPin, Phone } from 'lucide-react';
import { useState } from 'react';

const STATUS_LABELS: Record<string,string> = { new:'Nuevo', contacted:'Contactado', qualified:'Calificado', proposal:'Propuesta', negotiating:'Negociando', won:'Ganado', lost:'Perdido' };
const STATUS_COLORS: Record<string,string> = {
    new:'bg-secondary text-secondary-foreground', contacted:'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    qualified:'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400', proposal:'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    negotiating:'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    won:'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', lost:'bg-muted text-muted-foreground',
};
const INTERACTION_LABELS: Record<string,string> = { call:'Llamada', email:'Correo', visit:'Visita', whatsapp:'WhatsApp', meeting:'Reunión', other:'Otro' };
const fmt = (n?: string | null) => n ? Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 }) : '—';

interface Interaction { id: number; type: string; subject?: string; notes?: string; interaction_at: string; user: { name: string } }
interface Property { id: number; reference: string; title: string; type: string; sale_price?: string; rent_price?: string; currency: string; zone?: string; city?: string; media: any[] }
interface Lead {
    id: number; reference: string; name: string; phone?: string; email?: string;
    deal_type: string; property_type: string; budget_min?: string; budget_max?: string;
    preferred_zone?: string; bedrooms_min: number; bathrooms_min: number;
    status: string; source: string; notes?: string;
    agent?: { name: string }; creator: { name: string };
    interactions: Interaction[];
    deals: any[];
}

export default function LeadShow({ lead, matches }: { lead: Lead; matches: Property[] }) {
    const [showInteraction, setShowInteraction] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        type: 'call', subject: '', notes: '', interaction_at: new Date().toISOString().slice(0, 16),
    });

    const submitInteraction = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/realestate/leads/${lead.id}/interactions`, {
            onSuccess: () => { reset(); setShowInteraction(false); },
        });
    };

    return (
        <>
            <Head title={lead.name} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.visit('/realestate/leads')} className="rounded p-1 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold">{lead.name}</h1>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[lead.status]}`}>{STATUS_LABELS[lead.status]}</span>
                            </div>
                            <p className="text-sm font-mono text-muted-foreground">{lead.reference}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => router.visit(`/realestate/leads/${lead.id}/edit`)}
                            className="rounded border border-border bg-card px-3 py-1.5 text-sm hover:bg-accent transition-colors">Editar</button>
                        <button onClick={() => setShowInteraction(true)}
                            className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors">+ Interacción</button>
                    </div>
                </div>

                {/* New interaction panel */}
                {showInteraction && (
                    <form onSubmit={submitInteraction} className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <h3 className="mb-3 font-medium text-sm">Nueva Interacción</h3>
                        <div className="grid grid-cols-4 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground">Tipo</label>
                                <select value={data.type} onChange={(e) => setData('type', e.target.value)}
                                    className="mt-0.5 w-full rounded border border-input bg-background px-2 py-1 text-sm">
                                    {Object.entries(INTERACTION_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Asunto</label>
                                <input type="text" value={data.subject} onChange={(e) => setData('subject', e.target.value)}
                                    className="mt-0.5 w-full rounded border border-input bg-background px-2 py-1 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Fecha/Hora</label>
                                <input type="datetime-local" value={data.interaction_at} onChange={(e) => setData('interaction_at', e.target.value)}
                                    className="mt-0.5 w-full rounded border border-input bg-background px-2 py-1 text-sm" />
                            </div>
                            <div className="flex items-end gap-2">
                                <button type="submit" disabled={processing} className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground">Guardar</button>
                                <button type="button" onClick={() => setShowInteraction(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
                            </div>
                            <div className="col-span-4">
                                <label className="text-xs text-muted-foreground">Notas</label>
                                <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={2}
                                    className="mt-0.5 w-full rounded border border-input bg-background px-2 py-1 text-sm resize-none" />
                            </div>
                        </div>
                    </form>
                )}

                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-4">
                        {/* Profile */}
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Perfil de Interés</h2>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div><span className="text-muted-foreground">Tipo negocio:</span> <span className="font-medium">{{ sale:'Compra', rent:'Renta', both:'Ambos' }[lead.deal_type]}</span></div>
                                <div><span className="text-muted-foreground">Propiedad:</span> <span className="font-medium capitalize">{lead.property_type}</span></div>
                                {lead.budget_min && <div><span className="text-muted-foreground">Presup. mín.:</span> <span className="font-medium">{fmt(lead.budget_min)}</span></div>}
                                {lead.budget_max && <div><span className="text-muted-foreground">Presup. máx.:</span> <span className="font-medium">{fmt(lead.budget_max)}</span></div>}
                                {lead.preferred_zone && <div className="col-span-2"><span className="text-muted-foreground">Zona preferida:</span> <span className="font-medium">{lead.preferred_zone}</span></div>}
                                {lead.bedrooms_min > 0 && <div><span className="text-muted-foreground">Dormitorios mín.:</span> <span className="font-medium">{lead.bedrooms_min}</span></div>}
                                {lead.bathrooms_min > 0 && <div><span className="text-muted-foreground">Baños mín.:</span> <span className="font-medium">{lead.bathrooms_min}</span></div>}
                            </div>
                        </div>

                        {/* Interactions */}
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Historial de Interacciones</h2>
                            {lead.interactions.length === 0
                                ? <p className="text-sm text-muted-foreground">Sin interacciones registradas.</p>
                                : <div className="space-y-3">
                                    {lead.interactions.map((i) => (
                                        <div key={i.id} className="flex gap-3 border-l-2 border-primary/20 pl-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium uppercase tracking-wider text-primary/70">{INTERACTION_LABELS[i.type]}</span>
                                                    {i.subject && <span className="text-sm font-medium text-foreground">{i.subject}</span>}
                                                </div>
                                                {i.notes && <p className="mt-0.5 text-sm text-foreground/80">{i.notes}</p>}
                                                <p className="mt-0.5 text-xs text-muted-foreground">{new Date(i.interaction_at).toLocaleString('es-HN')} · {i.user.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>}
                        </div>

                        {/* Matching properties */}
                        {matches.length > 0 && (
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                <h2 className="mb-3 font-medium">Propiedades Coincidentes ({matches.length})</h2>
                                <div className="grid grid-cols-2 gap-3">
                                    {matches.slice(0, 6).map((p) => (
                                        <div key={p.id} onClick={() => router.visit(`/realestate/properties/${p.id}`)}
                                            className="cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors">
                                            <p className="font-medium text-sm line-clamp-1">{p.title}</p>
                                            <p className="text-xs font-mono text-muted-foreground">{p.reference}</p>
                                            {(p.zone || p.city) && <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{[p.zone,p.city].filter(Boolean).join(', ')}</p>}
                                            <p className="mt-1 text-sm font-semibold text-primary">{p.sale_price ? `${p.currency} ${fmt(p.sale_price)}` : p.rent_price ? `${p.currency} ${fmt(p.rent_price)}/mes` : '—'}</p>
                                        </div>
                                    ))}
                                </div>
                                {matches.length > 6 && <p className="mt-2 text-xs text-center text-muted-foreground">+{matches.length - 6} propiedades más</p>}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 text-sm font-medium">Contacto</h2>
                            {lead.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{lead.phone}</div>}
                            {lead.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{lead.email}</div>}
                        </div>
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-2 text-sm font-medium">Asignación</h2>
                            <p className="text-sm"><span className="text-muted-foreground">Agente:</span> {lead.agent?.name ?? '—'}</p>
                            <p className="text-sm"><span className="text-muted-foreground">Creado por:</span> {lead.creator.name}</p>
                        </div>
                        {lead.notes && (
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                <h2 className="mb-1 text-sm font-medium">Notas</h2>
                                <p className="text-sm text-foreground/80">{lead.notes}</p>
                            </div>
                        )}
                        <button onClick={() => router.visit(`/realestate/deals/create?lead_id=${lead.id}`)}
                            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
                            + Crear Negocio
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

LeadShow.layout = (page: React.ReactNode) => {
    const l = (page as any).props.lead;
    const bc: BreadcrumbItem[] = [
        { title: 'Leads', href: '/realestate/leads' },
        { title: l.name, href: `/realestate/leads/${l.id}` },
    ];
    return <AppLayout breadcrumbs={bc}>{page}</AppLayout>;
};
