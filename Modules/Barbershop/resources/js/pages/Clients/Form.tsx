import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface BarberOption { id: number; name: string; }

interface ContactDetail {
    id: number;
    name: string;
    phone: string | null;
    mobile: string | null;
    email: string | null;
    notes: string | null;
    active: boolean;
}

interface ProfileDetail {
    preferred_barber_id: number | null;
    preferred_style: string | null;
}

interface Props {
    client: ContactDetail | null;
    profile: ProfileDetail | null;
    barbers: BarberOption[];
}

export default function ClientForm({ client, profile, barbers }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const isEdit = client !== null;

    const { data, setData, post, patch, processing, errors } = useForm({
        name:                client?.name ?? '',
        phone:               client?.phone ?? '',
        email:               client?.email ?? '',
        notes:               client?.notes ?? '',
        active:              client?.active ?? true,
        preferred_style:     profile?.preferred_style ?? '',
        preferred_barber_id: profile?.preferred_barber_id ? String(profile.preferred_barber_id) : '__none__',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            ...data,
            preferred_barber_id: data.preferred_barber_id === '__none__' ? null : data.preferred_barber_id,
        };
        if (isEdit) {
            patch(`/barbershop/clients/${client.id}`, { data: payload } as any);
        } else {
            post('/barbershop/clients', { data: payload } as any);
        }
    }

    return (
        <>
            <Head title={isEdit ? `Editar: ${client.name}` : 'Nuevo Cliente'} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <Link href="/barbershop/clients">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />Clientes
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">{isEdit ? client.name : 'Nuevo Cliente'}</h1>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* Datos del contacto */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Datos de Contacto</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label htmlFor="name">Nombre completo *</Label>
                                <Input
                                    id="name"
                                    placeholder="Nombre del cliente"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input
                                    id="phone"
                                    placeholder="Número de teléfono"
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="correo@ejemplo.com"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label htmlFor="notes">Notas</Label>
                                <textarea
                                    id="notes"
                                    className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[70px]"
                                    placeholder="Alergias, preferencias especiales, observaciones…"
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Perfil de barbería */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Perfil de Barbería</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label>Barbero preferido</Label>
                                <Select
                                    value={data.preferred_barber_id}
                                    onValueChange={v => setData('preferred_barber_id', v)}
                                >
                                    <SelectTrigger><SelectValue placeholder="Sin preferencia" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Sin preferencia</SelectItem>
                                        {barbers.map(b => (
                                            <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="preferred_style">Estilo preferido</Label>
                                <Input
                                    id="preferred_style"
                                    placeholder="Ej: Fade bajo, barba perfilada"
                                    value={data.preferred_style}
                                    onChange={e => setData('preferred_style', e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Estado */}
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Estado</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="active"
                                    checked={data.active}
                                    onCheckedChange={v => setData('active', v === true)}
                                />
                                <Label htmlFor="active" className="cursor-pointer">Cliente activo</Label>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Link href="/barbershop/clients">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? <><Spinner className="mr-1" />Guardando…</>
                                : isEdit ? 'Actualizar Cliente' : 'Crear Cliente'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ClientForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Barbería', href: '/barbershop' },
        { title: 'Clientes', href: '/barbershop/clients' },
        { title: 'Detalle', href: '#' },
    ],
};
