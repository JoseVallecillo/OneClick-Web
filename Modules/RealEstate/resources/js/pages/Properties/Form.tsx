import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Property {
    id?: number; reference?: string; type?: string; status?: string; title?: string;
    description?: string; address?: string; city?: string; zone?: string; department?: string;
    latitude?: string; longitude?: string;
    land_area?: string; build_area?: string; bedrooms?: number; bathrooms?: number;
    parking_spots?: number; floors?: number; soil_type?: string;
    has_water?: boolean; has_electricity?: boolean; has_gas?: boolean;
    has_internet?: boolean; has_sewage?: boolean;
    sale_price?: string; rent_price?: string; currency?: string;
    agent_id?: number | null; notes?: string;
}

interface Props { property?: Property }

const TYPES = ['apartment','house','land','commercial','office','warehouse'];
const TYPE_LABELS: Record<string,string> = { apartment:'Apartamento', house:'Casa', land:'Terreno', commercial:'Comercial', office:'Oficina', warehouse:'Bodega' };
const SOIL_TYPES = ['residential','commercial','industrial','agricultural','mixed'];
const SOIL_LABELS: Record<string,string> = { residential:'Residencial', commercial:'Comercial', industrial:'Industrial', agricultural:'Agrícola', mixed:'Mixto' };

export default function PropertyForm({ property }: Props) {
    const isEdit = !!property?.id;

    const { data, setData, post, patch, processing, errors } = useForm({
        type: property?.type ?? 'apartment',
        status: property?.status ?? 'available',
        title: property?.title ?? '',
        description: property?.description ?? '',
        address: property?.address ?? '',
        city: property?.city ?? '',
        zone: property?.zone ?? '',
        department: property?.department ?? '',
        latitude: property?.latitude ?? '',
        longitude: property?.longitude ?? '',
        land_area: property?.land_area ?? '',
        build_area: property?.build_area ?? '',
        bedrooms: property?.bedrooms ?? 0,
        bathrooms: property?.bathrooms ?? 0,
        parking_spots: property?.parking_spots ?? 0,
        floors: property?.floors ?? 1,
        soil_type: property?.soil_type ?? '',
        has_water: property?.has_water ?? false,
        has_electricity: property?.has_electricity ?? false,
        has_gas: property?.has_gas ?? false,
        has_internet: property?.has_internet ?? false,
        has_sewage: property?.has_sewage ?? false,
        sale_price: property?.sale_price ?? '',
        rent_price: property?.rent_price ?? '',
        currency: property?.currency ?? 'HNL',
        agent_id: property?.agent_id ?? '',
        notes: property?.notes ?? '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            patch(`/realestate/properties/${property!.id}`);
        } else {
            post('/realestate/properties');
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Propiedades', href: '/realestate/properties' },
        { title: isEdit ? `Editar ${property?.reference}` : 'Nueva Propiedad', href: '#' },
    ];

    const field = (label: string, key: keyof typeof data, type = 'text', extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
        <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">{label}</Label>
            <Input type={type} value={data[key] as string} onChange={(e) => setData(key, e.target.value)} {...extra} />
            {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
        </div>
    );

    const serviceCheck = (label: string, key: 'has_water'|'has_electricity'|'has_gas'|'has_internet'|'has_sewage') => (
        <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={data[key]} onChange={(e) => setData(key, e.target.checked)} className="rounded" />
            {label}
        </label>
    );

    return (
        <>
            <Head title={isEdit ? 'Editar Propiedad' : 'Nueva Propiedad'} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.visit('/realestate/properties')} className="rounded p-1 hover:bg-muted transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl font-semibold">{isEdit ? `Editar ${property?.reference}` : 'Nueva Propiedad'}</h1>
                </div>

                <form onSubmit={submit} className="grid grid-cols-3 gap-4">
                    {/* General */}
                    <div className="col-span-2 space-y-4">
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Información General</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">{field('Título', 'title')}</div>
                                <div>
                                    <Label className="text-sm font-medium">Tipo</Label>
                                    <Select value={data.type} onValueChange={(v) => setData('type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Estado</Label>
                                    <Select value={data.status} onValueChange={(v) => setData('status', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['available','reserved','sold','rented','maintenance','inactive'].map((s) => (
                                                <SelectItem key={s} value={s}>{{available:'Disponible',reserved:'Reservado',sold:'Vendido',rented:'Arrendado',maintenance:'Mantenimiento',inactive:'Inactivo'}[s]}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-sm font-medium">Descripción</Label>
                                    <textarea value={data.description} onChange={(e) => setData('description', e.target.value)}
                                        rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Ubicación</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">{field('Dirección', 'address')}</div>
                                {field('Ciudad', 'city')}
                                {field('Zona / Colonia', 'zone')}
                                {field('Departamento', 'department')}
                                <div />
                                {field('Latitud', 'latitude', 'number', { step: 'any' })}
                                {field('Longitud', 'longitude', 'number', { step: 'any' })}
                            </div>
                        </div>

                        {/* Technical */}
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Ficha Técnica</h2>
                            <div className="grid grid-cols-3 gap-3">
                                {field('m² Terreno', 'land_area', 'number', { min: '0', step: '0.01' })}
                                {field('m² Construcción', 'build_area', 'number', { min: '0', step: '0.01' })}
                                {field('Dormitorios', 'bedrooms', 'number', { min: '0' })}
                                {field('Baños', 'bathrooms', 'number', { min: '0' })}
                                {field('Parqueos', 'parking_spots', 'number', { min: '0' })}
                                {field('Pisos', 'floors', 'number', { min: '1' })}
                                <div>
                                    <Label className="text-sm font-medium">Tipo de Suelo</Label>
                                    <Select value={data.soil_type || '_none'} onValueChange={(v) => setData('soil_type', v === '_none' ? '' : v)}>
                                        <SelectTrigger><SelectValue placeholder="N/A" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_none">N/A</SelectItem>
                                            {SOIL_TYPES.map((s) => <SelectItem key={s} value={s}>{SOIL_LABELS[s]}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="mt-3">
                                <Label className="mb-2 block text-sm font-medium">Servicios</Label>
                                <div className="flex flex-wrap gap-4">
                                    {serviceCheck('Agua', 'has_water')}
                                    {serviceCheck('Electricidad', 'has_electricity')}
                                    {serviceCheck('Gas', 'has_gas')}
                                    {serviceCheck('Internet', 'has_internet')}
                                    {serviceCheck('Alcantarillado', 'has_sewage')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Precios</h2>
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-sm font-medium">Moneda</Label>
                                    <Select value={data.currency} onValueChange={(v) => setData('currency', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="HNL">HNL (Lempira)</SelectItem>
                                            <SelectItem value="USD">USD (Dólar)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {field('Precio de Venta', 'sale_price', 'number', { min: '0', step: '0.01' })}
                                {field('Precio de Renta', 'rent_price', 'number', { min: '0', step: '0.01' })}
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Asignación</h2>
                            {field('ID Agente', 'agent_id', 'number')}
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Notas</h2>
                            <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)}
                                rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
                        </div>

                        <Button type="submit" className="w-full" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {isEdit ? 'Guardar Cambios' : 'Crear Propiedad'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

PropertyForm.layout = (page: React.ReactNode) => {
    const props = (page as any).props;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Propiedades', href: '/realestate/properties' },
        { title: props.property ? `Editar ${props.property.reference}` : 'Nueva Propiedad', href: '#' },
    ];
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
