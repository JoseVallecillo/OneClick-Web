import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Plus, Users } from 'lucide-react';
import { useCallback, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Leads', href: '/realestate/leads' }];

const STATUS_LABELS: Record<string,string> = { new:'Nuevo', contacted:'Contactado', qualified:'Calificado', proposal:'Propuesta', negotiating:'Negociando', won:'Ganado', lost:'Perdido' };
const STATUS_COLORS: Record<string,string> = {
    new:'bg-secondary text-secondary-foreground',
    contacted:'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    qualified:'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    proposal:'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    negotiating:'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    won:'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    lost:'bg-muted text-muted-foreground',
};
const DEAL_LABELS: Record<string,string> = { sale:'Venta', rent:'Renta', both:'Ambos' };
const fmt = (n?: string | null) => n ? Number(n).toLocaleString('es-HN', { minimumFractionDigits: 0 }) : null;

interface Lead {
    id: number; reference: string; name: string; phone?: string; email?: string;
    deal_type: string; property_type: string; budget_min?: string; budget_max?: string;
    preferred_zone?: string; status: string; source: string;
    interactions_count: number;
    agent?: { name: string };
    created_at: string;
}

interface Props {
    leads: { data: Lead[]; links: any[]; meta: any };
    filters: Record<string, string>;
}

export default function LeadsIndex({ leads, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [dealType, setDealType] = useState(filters.deal_type ?? '');

    const navigate = useCallback((overrides: Record<string,string>) => {
        router.get('/realestate/leads', { search, status, deal_type: dealType, ...filters, ...overrides }, { preserveState: true, replace: true });
    }, [search, status, dealType, filters]);

    return (
        <>
            <Head title="Leads CRM" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Leads Inmobiliarios</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.visit('/realestate/leads/matches')}>
                            Matching Automático
                        </Button>
                        <Button size="sm" onClick={() => router.visit('/realestate/leads/create')}>
                            <Plus className="mr-1 h-4 w-4" />Nuevo Lead
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <Input placeholder="Nombre, referencia, email..." className="w-56"
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && navigate({ search })} />
                    <Select value={status || '_all'} onValueChange={(v) => { const val = v === '_all' ? '' : v; setStatus(val); navigate({ status: val }); }}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Todos</SelectItem>
                            {Object.entries(STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={dealType || '_all'} onValueChange={(v) => { const val = v === '_all' ? '' : v; setDealType(val); navigate({ deal_type: val }); }}>
                        <SelectTrigger className="w-32"><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Todos</SelectItem>
                            {Object.entries(DEAL_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => navigate({ search })}>Filtrar</Button>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Lead</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Interés</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Presupuesto</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Agente</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Interacc.</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {leads.data.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                    <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
                                    No hay leads que coincidan.
                                </td></tr>
                            ) : leads.data.map((l) => (
                                <tr key={l.id} className="cursor-pointer hover:bg-muted/30 transition-colors"
                                    onClick={() => router.visit(`/realestate/leads/${l.id}`)}>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-foreground">{l.name}</p>
                                        <p className="text-xs font-mono text-muted-foreground">{l.reference}</p>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {DEAL_LABELS[l.deal_type]}{l.preferred_zone ? ` · ${l.preferred_zone}` : ''}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-foreground">
                                        {l.budget_min || l.budget_max
                                            ? [fmt(l.budget_min), fmt(l.budget_max)].filter(Boolean).join(' – ')
                                            : <span className="text-muted-foreground/40">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{l.agent?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-center text-muted-foreground">{l.interactions_count}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[l.status]}`}>
                                            {STATUS_LABELS[l.status]}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {leads.links && (
                    <div className="flex justify-center gap-1">
                        {leads.links.map((link: any, i: number) => (
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

LeadsIndex.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
