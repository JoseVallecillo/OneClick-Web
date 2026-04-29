import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { BadgeDollarSign } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Comisiones', href: '/realestate/commissions' }];
const STATUS_LABELS: Record<string,string> = { pending:'Pendiente', approved:'Aprobado', paid:'Pagado', cancelled:'Cancelado' };
const STATUS_COLORS: Record<string,string> = {
    pending:'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    approved:'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    paid:'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    cancelled:'bg-muted text-muted-foreground',
};
const fmt = (n?: string | null) => n ? Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 }) : '—';

interface Commission {
    id: number; commission_pct: string; base_amount: string; commission_amount: string; status: string;
    approved_at?: string; paid_at?: string;
    deal: { id: number; reference: string; property: { title: string } };
    agent: { id: number; name: string };
    approver?: { name: string };
}
interface Props {
    commissions: { data: Commission[]; links: any[]; meta: any };
    agents: { id: number; name: string }[];
    filters: Record<string, string>;
}

export default function CommissionsIndex({ commissions, agents, filters }: Props) {
    const [status, setStatus] = useState(filters.status ?? '');
    const [agentId, setAgentId] = useState(filters.agent_id ?? '');

    const navigate = (overrides: Record<string,string>) =>
        router.get('/realestate/commissions', { status, agent_id: agentId, ...filters, ...overrides }, { preserveState: true, replace: true });

    const { post: doApprove, processing: approveProcessing } = useForm({});
    const [payRef, setPayRef] = useState<Record<number, string>>({});
    const { post: doPay } = useForm({});

    return (
        <>
            <Head title="Comisiones" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <h1 className="text-xl font-semibold">Comisiones de Agentes</h1>

                <div className="flex flex-wrap gap-2">
                    <Select value={status || '_all'} onValueChange={(v) => { const val = v==='_all'?'':v; setStatus(val); navigate({ status: val }); }}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Todos</SelectItem>
                            {Object.entries(STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={agentId || '_all'} onValueChange={(v) => { const val = v==='_all'?'':v; setAgentId(val); navigate({ agent_id: val }); }}>
                        <SelectTrigger className="w-48"><SelectValue placeholder="Agente" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="_all">Todos los agentes</SelectItem>
                            {agents.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Negocio</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Agente</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Base</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">%</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Comisión</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Estado</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {commissions.data.length === 0 ? (
                                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                    <BadgeDollarSign className="mx-auto mb-2 h-8 w-8 opacity-40" />Sin comisiones.
                                </td></tr>
                            ) : commissions.data.map((c) => (
                                <tr key={c.id} className="hover:bg-muted/20">
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-sm cursor-pointer text-primary hover:underline" onClick={() => router.visit(`/realestate/deals/${c.deal.id}`)}>{c.deal.reference}</span>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{c.deal.property.title}</p>
                                    </td>
                                    <td className="px-4 py-3 text-foreground">{c.agent.name}</td>
                                    <td className="px-4 py-3 text-right text-muted-foreground">{fmt(c.base_amount)}</td>
                                    <td className="px-4 py-3 text-center text-muted-foreground">{c.commission_pct}%</td>
                                    <td className="px-4 py-3 text-right font-bold text-primary">{fmt(c.commission_amount)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {c.status === 'pending' && (
                                            <button onClick={() => doApprove(`/realestate/commissions/${c.id}/approve`, { method: 'post' })} disabled={approveProcessing}
                                                className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-500">Aprobar</button>
                                        )}
                                        {c.status === 'approved' && (
                                            <div className="flex items-center gap-1">
                                                <input type="text" value={payRef[c.id] ?? ''} onChange={(e) => setPayRef((prev) => ({ ...prev, [c.id]: e.target.value }))}
                                                    placeholder="Referencia pago" className="w-28 rounded border border-input bg-background px-1.5 py-0.5 text-xs" />
                                                <button onClick={() => doPay(`/realestate/commissions/${c.id}/pay`, { method: 'post', data: { payment_reference: payRef[c.id] ?? '' } })}
                                                    className="rounded bg-emerald-600 px-2 py-0.5 text-xs text-white hover:bg-emerald-500">Pagar</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {commissions.links && (
                    <div className="flex justify-center gap-1">
                        {commissions.links.map((link: any, i: number) => (
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

CommissionsIndex.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
