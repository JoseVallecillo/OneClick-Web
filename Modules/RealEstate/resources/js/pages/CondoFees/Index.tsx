import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Home, Plus } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Cuotas de Mantenimiento', href: '/realestate/condo-fees' }];
const STATUS_LABELS: Record<string,string> = { pending:'Pendiente', paid:'Pagado', overdue:'Vencido', waived:'Condonado' };
const STATUS_COLORS: Record<string,string> = { pending:'bg-amber-500/20 text-amber-600 dark:text-amber-400', paid:'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', overdue:'bg-destructive/20 text-destructive', waived:'bg-muted text-muted-foreground' };
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const fmt = (n?: string | null) => n ? Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 }) : '—';
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('es-HN') : '—';

interface Fee {
    id: number; reference: string; period_year: number; period_month: number;
    amount: string; due_date: string; status: string; paid_at?: string; payment_reference?: string;
    property: { title: string; reference: string };
    contact: { name: string };
}
interface Props {
    fees: { data: Fee[]; links: any[]; meta: any };
    properties: { id: number; reference: string; title: string }[];
    contacts: { id: number; name: string }[];
    filters: Record<string, string>;
}

export default function CondoFeesIndex({ fees, properties, contacts, filters }: Props) {
    const [status, setStatus] = useState(filters.status ?? '');
    const [propertyId, setPropertyId] = useState(filters.property_id ?? '');
    const [showCreate, setShowCreate] = useState(false);
    const [payFee, setPayFee] = useState<number | null>(null);
    const [payRef, setPayRef] = useState('');
    const [payInvoice, setPayInvoice] = useState('');

    const navigate = (overrides: Record<string,string>) =>
        router.get('/realestate/condo-fees', { status, property_id: propertyId, ...filters, ...overrides }, { preserveState: true, replace: true });

    const { data, setData, post, processing, reset } = useForm({
        property_id: '', contact_id: '',
        period_year: new Date().getFullYear(), period_month: new Date().getMonth() + 1,
        amount: '', due_date: '', notes: '',
    });

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/realestate/condo-fees', { onSuccess: () => { reset(); setShowCreate(false); } });
    };

    const { post: doPay, processing: payProcessing } = useForm({});
    const handlePay = (feeId: number) => {
        doPay(`/realestate/condo-fees/${feeId}/pay`, {
            method: 'post', data: { payment_reference: payRef, invoice_number: payInvoice },
            onSuccess: () => { setPayFee(null); setPayRef(''); setPayInvoice(''); },
        });
    };

    return (
        <>
            <Head title="Cuotas de Mantenimiento" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Cuotas de Mantenimiento</h1>
                    <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
                        <Plus className="mr-1 h-4 w-4" />Nueva Cuota
                    </Button>
                </div>

                {/* Create form */}
                {showCreate && (
                    <form onSubmit={submitCreate} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                        <h3 className="mb-3 font-medium">Nueva Cuota de Mantenimiento</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground">Propiedad *</label>
                                <Select value={data.property_id || '_none'} onValueChange={(v) => setData('property_id', v === '_none' ? '' : v)}>
                                    <SelectTrigger className="mt-0.5"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                    <SelectContent>{properties.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.reference} — {p.title}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Responsable *</label>
                                <Select value={data.contact_id || '_none'} onValueChange={(v) => setData('contact_id', v === '_none' ? '' : v)}>
                                    <SelectTrigger className="mt-0.5"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                    <SelectContent>{contacts.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Mes</label>
                                <Select value={String(data.period_month)} onValueChange={(v) => setData('period_month', parseInt(v))}>
                                    <SelectTrigger className="mt-0.5"><SelectValue /></SelectTrigger>
                                    <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div><label className="text-xs text-muted-foreground">Año</label><input type="number" value={data.period_year} onChange={(e) => setData('period_year', parseInt(e.target.value))} className="mt-0.5 w-full rounded border border-input bg-background px-2 py-1.5 text-sm" /></div>
                            <div><label className="text-xs text-muted-foreground">Monto *</label><input type="number" value={data.amount} onChange={(e) => setData('amount', e.target.value)} className="mt-0.5 w-full rounded border border-input bg-background px-2 py-1.5 text-sm" /></div>
                            <div><label className="text-xs text-muted-foreground">Fecha Vencimiento *</label><input type="date" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} className="mt-0.5 w-full rounded border border-input bg-background px-2 py-1.5 text-sm" /></div>
                            <div className="col-span-3 flex gap-2">
                                <Button type="submit" size="sm" disabled={processing}>Crear Cuota</Button>
                                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
                            </div>
                        </div>
                    </form>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <Select value={status || '_all'} onValueChange={(v) => { const val = v==='_all'?'':v; setStatus(val); navigate({ status: val }); }}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
                        <SelectContent><SelectItem value="_all">Todos</SelectItem>{Object.entries(STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={propertyId || '_all'} onValueChange={(v) => { const val = v==='_all'?'':v; setPropertyId(val); navigate({ property_id: val }); }}>
                        <SelectTrigger className="w-52"><SelectValue placeholder="Propiedad" /></SelectTrigger>
                        <SelectContent><SelectItem value="_all">Todas las propiedades</SelectItem>{properties.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.reference} — {p.title}</SelectItem>)}</SelectContent>
                    </Select>
                </div>

                <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Referencia</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Propiedad</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Responsable</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Período</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Monto</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Vence</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Estado</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {fees.data.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                    <Home className="mx-auto mb-2 h-8 w-8 opacity-40" />Sin cuotas de mantenimiento.
                                </td></tr>
                            ) : fees.data.map((f) => (
                                <>
                                    <tr key={f.id} className="hover:bg-muted/20">
                                        <td className="px-4 py-3 font-mono text-sm text-foreground">{f.reference}</td>
                                        <td className="px-4 py-3 text-foreground/90 line-clamp-1">{f.property.title}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{f.contact.name}</td>
                                        <td className="px-4 py-3 text-center text-muted-foreground">{MONTHS[f.period_month - 1]} {f.period_year}</td>
                                        <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(f.amount)}</td>
                                        <td className="px-4 py-3 text-center text-muted-foreground">{fmtDate(f.due_date)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[f.status]}`}>{STATUS_LABELS[f.status]}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {!['paid','waived'].includes(f.status) && (
                                                <button onClick={() => setPayFee(payFee === f.id ? null : f.id)}
                                                    className="rounded bg-emerald-600 px-2 py-0.5 text-xs text-white hover:bg-emerald-500">Registrar Pago</button>
                                            )}
                                        </td>
                                    </tr>
                                    {payFee === f.id && (
                                        <tr key={`pay-${f.id}`} className="bg-emerald-500/5">
                                            <td colSpan={8} className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <input type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Referencia de pago *" className="rounded border border-input bg-background px-2 py-1 text-sm w-40" />
                                                    <input type="text" value={payInvoice} onChange={(e) => setPayInvoice(e.target.value)} placeholder="N° Factura" className="rounded border border-input bg-background px-2 py-1 text-sm w-32" />
                                                    <button onClick={() => handlePay(f.id)} disabled={payProcessing || !payRef}
                                                        className="rounded bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-500 disabled:opacity-50">Confirmar Pago</button>
                                                    <button onClick={() => setPayFee(null)} className="text-xs text-muted-foreground">Cancelar</button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>

                {fees.links && (
                    <div className="flex justify-center gap-1">
                        {fees.links.map((link: any, i: number) => (
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

CondoFeesIndex.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
