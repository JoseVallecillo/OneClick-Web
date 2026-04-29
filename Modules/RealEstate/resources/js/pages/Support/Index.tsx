import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { LifeBuoy, Plus } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Soporte Post-Venta', href: '/realestate/support' }];
const STATUS_LABELS: Record<string,string> = { open:'Abierto', in_progress:'En Proceso', resolved:'Resuelto', closed:'Cerrado' };
const STATUS_COLORS: Record<string,string> = { open:'bg-blue-500/20 text-blue-600 dark:text-blue-400', in_progress:'bg-amber-500/20 text-amber-600 dark:text-amber-400', resolved:'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', closed:'bg-muted text-muted-foreground' };
const PRIORITY_COLORS: Record<string,string> = { low:'text-muted-foreground', medium:'text-amber-600', high:'text-orange-600', urgent:'text-destructive font-semibold' };
const TYPE_LABELS: Record<string,string> = { warranty:'Garantía', repair:'Reparación', hidden_defect:'Vicio Oculto', maintenance:'Mantenimiento', complaint:'Queja', other:'Otro' };

interface Ticket {
    id: number; reference: string; title: string; type: string; priority: string; status: string;
    contact: { name: string }; property?: { title: string }; assignee?: { name: string };
    created_at: string;
}
interface Props {
    tickets: { data: Ticket[]; links: any[]; meta: any };
    agents: { id: number; name: string }[];
    contacts: { id: number; name: string }[];
    properties: { id: number; reference: string; title: string }[];
    filters: Record<string, string>;
}

export default function SupportIndex({ tickets, agents, contacts, properties, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [priority, setPriority] = useState(filters.priority ?? '');
    const [showCreate, setShowCreate] = useState(false);

    const navigate = (overrides: Record<string,string>) =>
        router.get('/realestate/support', { search, status, priority, ...filters, ...overrides }, { preserveState: true, replace: true });

    const { data, setData, post, processing, reset } = useForm({
        contact_id: '', property_id: '', deal_id: '', type: 'repair',
        title: '', description: '', priority: 'medium', assigned_to: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/realestate/support', { onSuccess: () => { reset(); setShowCreate(false); } });
    };

    return (
        <>
            <Head title="Soporte Post-Venta" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Soporte Post-Venta</h1>
                    <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
                        <Plus className="mr-1 h-4 w-4" />Nuevo Ticket
                    </Button>
                </div>

                {/* Create form */}
                {showCreate && (
                    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                        <h3 className="mb-3 font-medium">Nuevo Ticket de Soporte</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground">Cliente *</label>
                                <Select value={data.contact_id || '_none'} onValueChange={(v) => setData('contact_id', v === '_none' ? '' : v)}>
                                    <SelectTrigger className="mt-0.5"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                    <SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Propiedad</label>
                                <Select value={data.property_id || '_none'} onValueChange={(v) => setData('property_id', v === '_none' ? '' : v)}>
                                    <SelectTrigger className="mt-0.5"><SelectValue placeholder="Opcional..." /></SelectTrigger>
                                    <SelectContent><SelectItem value="_none">Sin propiedad</SelectItem>{properties.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.reference} — {p.title}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Tipo</label>
                                <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                                    <SelectTrigger className="mt-0.5"><SelectValue /></SelectTrigger>
                                    <SelectContent>{Object.entries(TYPE_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs text-muted-foreground">Título *</label>
                                <Input value={data.title} onChange={(e) => setData('title', e.target.value)} className="mt-0.5" />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Prioridad</label>
                                <Select value={data.priority} onValueChange={(v) => setData('priority', v)}>
                                    <SelectTrigger className="mt-0.5"><SelectValue /></SelectTrigger>
                                    <SelectContent>{['low','medium','high','urgent'].map((p) => <SelectItem key={p} value={p}>{{low:'Baja',medium:'Media',high:'Alta',urgent:'Urgente'}[p]}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-3">
                                <label className="text-xs text-muted-foreground">Descripción *</label>
                                <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={3}
                                    className="mt-0.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
                            </div>
                            <div className="col-span-3 flex gap-2">
                                <Button type="submit" size="sm" disabled={processing}>Crear Ticket</Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <Input placeholder="Referencia o título..." className="w-48" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && navigate({ search })} />
                    <Select value={status || '_all'} onValueChange={(v) => { const val = v==='_all'?'':v; setStatus(val); navigate({ status: val }); }}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent><SelectItem value="_all">Todos</SelectItem>{Object.entries(STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={priority || '_all'} onValueChange={(v) => { const val = v==='_all'?'':v; setPriority(val); navigate({ priority: val }); }}>
                        <SelectTrigger className="w-32"><SelectValue placeholder="Prioridad" /></SelectTrigger>
                        <SelectContent><SelectItem value="_all">Todas</SelectItem>{['low','medium','high','urgent'].map((p) => <SelectItem key={p} value={p}>{{low:'Baja',medium:'Media',high:'Alta',urgent:'Urgente'}[p]}</SelectItem>)}</SelectContent>
                    </Select>
                </div>

                <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ticket</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Propiedad</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Prioridad</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Asignado</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {tickets.data.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                    <LifeBuoy className="mx-auto mb-2 h-8 w-8 opacity-40" />Sin tickets de soporte.
                                </td></tr>
                            ) : tickets.data.map((t) => (
                                <tr key={t.id} className="hover:bg-muted/20">
                                    <td className="px-4 py-3">
                                        <p className="font-mono text-sm font-medium text-foreground">{t.reference}</p>
                                        <p className="text-xs text-foreground/80 line-clamp-1">{t.title}</p>
                                    </td>
                                    <td className="px-4 py-3 text-foreground/90">{t.contact.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground line-clamp-1">{t.property?.title ?? '—'}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{TYPE_LABELS[t.type]}</td>
                                    <td className={`px-4 py-3 text-center text-xs ${PRIORITY_COLORS[t.priority]}`}>{{low:'Baja',medium:'Media',high:'Alta',urgent:'URGENTE'}[t.priority]}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{t.assignee?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status]}`}>{STATUS_LABELS[t.status]}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {tickets.links && (
                    <div className="flex justify-center gap-1">
                        {tickets.links.map((link: any, i: number) => (
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

SupportIndex.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
