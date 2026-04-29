import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Handshake, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Negocios', href: '/realestate/deals' }];

const STATUS_LABELS: Record<string,string> = { draft:'Borrador', reserved:'Reservado', documents:'Documentos', contract:'Contrato', closing:'Cierre', completed:'Completado', cancelled:'Cancelado' };
const STATUS_COLORS: Record<string,string> = {
    draft:'bg-secondary text-secondary-foreground',
    reserved:'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    documents:'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    contract:'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    closing:'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    completed:'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    cancelled:'bg-muted text-muted-foreground',
};
const fmt = (n?: string | null) => n ? Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 }) : '—';

interface Deal {
    id: number; reference: string; deal_type: string; status: string;
    agreed_price?: string; currency: string;
    property: { title: string; reference: string };
    contact: { name: string };
    agent?: { name: string };
    created_at: string;
}

interface Props {
    deals: { data: Deal[]; links: any[]; meta: any };
    filters: Record<string, string>;
}

export default function DealsIndex({ deals, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [dealType, setDealType] = useState(filters.deal_type ?? '');

    const navigate = useCallback((overrides: Record<string,string>) => {
        router.get('/realestate/deals', { search, status, deal_type: dealType, ...filters, ...overrides }, { preserveState: true, replace: true });
    }, [search, status, dealType, filters]);

    return (
        <>
            <Head title="Negocios" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Negocios Inmobiliarios</h1>
                    <Button size="sm" onClick={() => router.visit('/realestate/deals/create')}>
                        <Plus className="mr-1 h-4 w-4" />Nuevo Negocio
                    </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Input placeholder="Referencia, cliente, propiedad..." className="w-56"
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && navigate({ search })} />
                    <Select value={status || '_all'} onValueChange={(v) => { const val = v==='_all'?'':v; setStatus(val); navigate({ status: val }); }}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Todos</SelectItem>
                            {Object.entries(STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={dealType || '_all'} onValueChange={(v) => { const val = v==='_all'?'':v; setDealType(val); navigate({ deal_type: val }); }}>
                        <SelectTrigger className="w-32"><SelectValue placeholder="Tipo" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Todos</SelectItem>
                            <SelectItem value="sale">Venta</SelectItem>
                            <SelectItem value="rent">Renta</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => navigate({ search })}>Filtrar</Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Referencia</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Propiedad</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Precio</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Agente</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {deals.data.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                    <Handshake className="mx-auto mb-2 h-8 w-8 opacity-40" />
                                    No hay negocios que coincidan.
                                </td></tr>
                            ) : deals.data.map((d) => (
                                <tr key={d.id} className="cursor-pointer hover:bg-muted/30 transition-colors"
                                    onClick={() => router.visit(`/realestate/deals/${d.id}`)}>
                                    <td className="px-4 py-3 font-mono font-medium text-foreground">{d.reference}</td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-foreground line-clamp-1">{d.property.title}</p>
                                        <p className="text-xs font-mono text-muted-foreground">{d.property.reference}</p>
                                    </td>
                                    <td className="px-4 py-3 text-foreground/90">{d.contact.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{d.deal_type === 'sale' ? 'Venta' : 'Renta'}</td>
                                    <td className="px-4 py-3 text-right font-medium text-foreground">{d.agreed_price ? `${d.currency} ${fmt(d.agreed_price)}` : '—'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{d.agent?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[d.status]}`}>{STATUS_LABELS[d.status]}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {deals.links && (
                    <div className="flex justify-center gap-1">
                        {deals.links.map((link: any, i: number) => (
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

DealsIndex.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
