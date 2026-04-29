import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Deal { id?: number; reference?: string; property_id?: number; lead_id?: number | null; contact_id?: number; deal_type?: string; agreed_price?: string; currency?: string; rent_period?: string; start_date?: string; end_date?: string; agent_id?: number | null; notes?: string; internal_notes?: string }
interface Props {
    deal?: Deal;
    properties: { id: number; reference: string; title: string; type: string; sale_price?: string; rent_price?: string; currency: string }[];
    contacts: { id: number; name: string }[];
    leads: { id: number; reference: string; name: string }[];
    agents: { id: number; name: string }[];
}

export default function DealForm({ deal, properties, contacts, leads, agents }: Props) {
    const isEdit = !!deal?.id;
    const { data, setData, post, patch, processing, errors } = useForm({
        property_id: deal?.property_id ?? '',
        lead_id: deal?.lead_id ?? '',
        contact_id: deal?.contact_id ?? '',
        deal_type: deal?.deal_type ?? 'sale',
        agreed_price: deal?.agreed_price ?? '',
        currency: deal?.currency ?? 'HNL',
        rent_period: deal?.rent_period ?? '',
        start_date: deal?.start_date ?? '',
        end_date: deal?.end_date ?? '',
        agent_id: deal?.agent_id ?? '',
        notes: deal?.notes ?? '',
        internal_notes: deal?.internal_notes ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        isEdit ? patch(`/realestate/deals/${deal!.id}`) : post('/realestate/deals');
    };

    const f = (label: string, key: keyof typeof data, type = 'text') => (
        <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">{label}</Label>
            <Input type={type} value={data[key] as string} onChange={(e) => setData(key, e.target.value)} />
            {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
        </div>
    );

    return (
        <>
            <Head title={isEdit ? 'Editar Negocio' : 'Nuevo Negocio'} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.visit('/realestate/deals')} className="rounded p-1 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></button>
                    <h1 className="text-xl font-semibold">{isEdit ? `Editar ${deal?.reference}` : 'Nuevo Negocio'}</h1>
                </div>

                <form onSubmit={submit} className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-4">
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Información del Negocio</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <Label className="text-sm font-medium">Propiedad</Label>
                                    <Select value={String(data.property_id) || '_none'} onValueChange={(v) => setData('property_id', v === '_none' ? '' : v)}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar propiedad..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_none">— Seleccionar —</SelectItem>
                                            {properties.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.reference} — {p.title}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {errors.property_id && <p className="text-xs text-destructive">{errors.property_id}</p>}
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Cliente</Label>
                                    <Select value={String(data.contact_id) || '_none'} onValueChange={(v) => setData('contact_id', v === '_none' ? '' : v)}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar cliente..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_none">— Seleccionar —</SelectItem>
                                            {contacts.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Lead Asociado</Label>
                                    <Select value={String(data.lead_id) || '_none'} onValueChange={(v) => setData('lead_id', v === '_none' ? '' : v)}>
                                        <SelectTrigger><SelectValue placeholder="Opcional..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_none">Sin lead</SelectItem>
                                            {leads.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.reference} — {l.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Tipo de Negocio</Label>
                                    <Select value={data.deal_type} onValueChange={(v) => setData('deal_type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sale">Venta</SelectItem>
                                            <SelectItem value="rent">Arrendamiento</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Moneda</Label>
                                    <Select value={data.currency} onValueChange={(v) => setData('currency', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="HNL">HNL</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {f('Precio Acordado', 'agreed_price', 'number')}
                                {data.deal_type === 'rent' && (
                                    <div>
                                        <Label className="text-sm font-medium">Período de Renta</Label>
                                        <Select value={data.rent_period || '_none'} onValueChange={(v) => setData('rent_period', v === '_none' ? '' : v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monthly">Mensual</SelectItem>
                                                <SelectItem value="quarterly">Trimestral</SelectItem>
                                                <SelectItem value="yearly">Anual</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                {f('Fecha Inicio', 'start_date', 'date')}
                                {data.deal_type === 'rent' && f('Fecha Fin', 'end_date', 'date')}
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Notas</h2>
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-sm font-medium">Notas (visibles al cliente)</Label>
                                    <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)}
                                        rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Notas Internas</Label>
                                    <textarea value={data.internal_notes} onChange={(e) => setData('internal_notes', e.target.value)}
                                        rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Agente</h2>
                            <Select value={String(data.agent_id) || '_none'} onValueChange={(v) => setData('agent_id', v === '_none' ? '' : v)}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar agente..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">Sin agente</SelectItem>
                                    {agents.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />{isEdit ? 'Guardar Cambios' : 'Crear Negocio'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

DealForm.layout = (page: React.ReactNode) => {
    const p = (page as any).props;
    const bc: BreadcrumbItem[] = [
        { title: 'Negocios', href: '/realestate/deals' },
        { title: p.deal ? `Editar ${p.deal.reference}` : 'Nuevo Negocio', href: '#' },
    ];
    return <AppLayout breadcrumbs={bc}>{page}</AppLayout>;
};
