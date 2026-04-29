import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface Lead {
    id?: number; reference?: string; contact_id?: number | null; name?: string; phone?: string; email?: string;
    deal_type?: string; property_type?: string; budget_min?: string; budget_max?: string;
    preferred_zone?: string; bedrooms_min?: number; bathrooms_min?: number;
    status?: string; source?: string; notes?: string; agent_id?: number | null;
}
interface Props { lead?: Lead; contacts: { id: number; name: string }[] }

const PROP_TYPES = ['any','apartment','house','land','commercial','office','warehouse'];
const PROP_LABELS: Record<string,string> = { any:'Cualquiera', apartment:'Apartamento', house:'Casa', land:'Terreno', commercial:'Comercial', office:'Oficina', warehouse:'Bodega' };

export default function LeadForm({ lead, contacts }: Props) {
    const isEdit = !!lead?.id;
    const { data, setData, post, patch, processing, errors } = useForm({
        contact_id: lead?.contact_id ?? '',
        name: lead?.name ?? '',
        phone: lead?.phone ?? '',
        email: lead?.email ?? '',
        deal_type: lead?.deal_type ?? 'sale',
        property_type: lead?.property_type ?? 'any',
        budget_min: lead?.budget_min ?? '',
        budget_max: lead?.budget_max ?? '',
        preferred_zone: lead?.preferred_zone ?? '',
        bedrooms_min: lead?.bedrooms_min ?? 0,
        bathrooms_min: lead?.bathrooms_min ?? 0,
        status: lead?.status ?? 'new',
        source: lead?.source ?? 'direct',
        notes: lead?.notes ?? '',
        agent_id: lead?.agent_id ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        isEdit ? patch(`/realestate/leads/${lead!.id}`) : post('/realestate/leads');
    };

    const f = (label: string, key: keyof typeof data, type = 'text') => (
        <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">{label}</Label>
            <Input type={type} value={data[key] as string} onChange={(e) => setData(key, e.target.value)} />
            {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
        </div>
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Leads', href: '/realestate/leads' },
        { title: isEdit ? `Editar ${lead?.reference}` : 'Nuevo Lead', href: '#' },
    ];

    return (
        <>
            <Head title={isEdit ? 'Editar Lead' : 'Nuevo Lead'} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.visit('/realestate/leads')} className="rounded p-1 hover:bg-muted transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl font-semibold">{isEdit ? `Editar ${lead?.reference}` : 'Nuevo Lead'}</h1>
                </div>

                <form onSubmit={submit} className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-4">
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Datos del Interesado</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-sm font-medium">Contacto existente</Label>
                                    <Select value={String(data.contact_id) || '_none'} onValueChange={(v) => setData('contact_id', v === '_none' ? '' : v)}>
                                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_none">Sin contacto</SelectItem>
                                            {contacts.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div />
                                {f('Nombre', 'name')}
                                {f('Teléfono', 'phone', 'tel')}
                                {f('Email', 'email', 'email')}
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Perfil de Interés</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-sm font-medium">Tipo de Negocio</Label>
                                    <Select value={data.deal_type} onValueChange={(v) => setData('deal_type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sale">Compra</SelectItem>
                                            <SelectItem value="rent">Renta</SelectItem>
                                            <SelectItem value="both">Ambos</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Tipo de Propiedad</Label>
                                    <Select value={data.property_type} onValueChange={(v) => setData('property_type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{PROP_TYPES.map((t) => <SelectItem key={t} value={t}>{PROP_LABELS[t]}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                {f('Presupuesto Mínimo', 'budget_min', 'number')}
                                {f('Presupuesto Máximo', 'budget_max', 'number')}
                                {f('Zona Preferida', 'preferred_zone')}
                                <div />
                                {f('Dormitorios mínimos', 'bedrooms_min', 'number')}
                                {f('Baños mínimos', 'bathrooms_min', 'number')}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Pipeline</h2>
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-sm font-medium">Estado</Label>
                                    <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['new','contacted','qualified','proposal','negotiating','won','lost'].map((s) => (
                                                <SelectItem key={s} value={s}>{{new:'Nuevo',contacted:'Contactado',qualified:'Calificado',proposal:'Propuesta',negotiating:'Negociando',won:'Ganado',lost:'Perdido'}[s]}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Fuente</Label>
                                    <Select value={data.source} onValueChange={(v) => setData('source', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['referral','web','social','direct','portal','other'].map((s) => (
                                                <SelectItem key={s} value={s}>{{referral:'Referido',web:'Web',social:'Redes Sociales',direct:'Directo',portal:'Portal',other:'Otro'}[s]}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Notas</Label>
                                    <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)}
                                        rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {isEdit ? 'Guardar Cambios' : 'Crear Lead'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

LeadForm.layout = (page: React.ReactNode) => {
    const p = (page as any).props;
    const bc: BreadcrumbItem[] = [
        { title: 'Leads', href: '/realestate/leads' },
        { title: p.lead ? `Editar ${p.lead.reference}` : 'Nuevo Lead', href: '#' },
    ];
    return <AppLayout breadcrumbs={bc}>{page}</AppLayout>;
};
