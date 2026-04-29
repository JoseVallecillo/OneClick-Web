import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Head, Link, useForm } from '@inertiajs/react';

interface Waiter {
    id: number;
    name: string;
    code: string | null;
    active: boolean;
}

interface Props { waiter: Waiter | null }

export default function WaiterForm({ waiter }: Props) {
    const isEdit = !!waiter;

    const { data, setData, post, put, processing, errors } = useForm({
        name:   waiter?.name ?? '',
        code:   waiter?.code ?? '',
        active: waiter?.active ?? true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) {
            put(`/pos/waiters/${waiter!.id}`);
        } else {
            post('/pos/waiters');
        }
    }

    return (
        <>
            <Head title={isEdit ? `Editar ${waiter.name}` : 'Nuevo Mesero'} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="mx-auto w-full max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>{isEdit ? `Editar Mesero` : 'Nuevo Mesero'}</CardTitle>
                            <CardDescription>
                                {isEdit 
                                    ? 'Modifica los datos del mesero en el sistema.' 
                                    : 'Registra un nuevo mesero para asignarle órdenes y mesas en el Punto de Venta.'}
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <form onSubmit={submit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nombre Completo <span className="text-destructive">*</span></Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            placeholder="Ej. Juan Pérez"
                                            autoFocus
                                            autoComplete="off"
                                        />
                                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="code">Código / Abreviatura</Label>
                                        <Input
                                            id="code"
                                            value={data.code}
                                            onChange={e => setData('code', e.target.value)}
                                            placeholder="Ej. JP, M01 (Opcional)"
                                            maxLength={20}
                                            autoComplete="off"
                                        />
                                        {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                                        <p className="text-[11px] text-muted-foreground">Opcional. Útil para identificar rápidamente al mesero en tickets o reportes.</p>
                                    </div>

                                    <div className="flex items-center space-x-2 pt-2">
                                        <Switch
                                            id="active"
                                            checked={data.active}
                                            onCheckedChange={checked => setData('active', checked)}
                                        />
                                        <Label htmlFor="active" className="cursor-pointer">
                                            {data.active ? 'Mesero activo (disponible en el POS)' : 'Mesero inactivo (oculto en el POS)'}
                                        </Label>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t">
                                    <Link href="/pos/waiters">
                                        <Button type="button" variant="outline">Cancelar</Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Guardando…' : isEdit ? 'Guardar Cambios' : 'Registrar Mesero'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

WaiterForm.layout = {
    breadcrumbs: (props: any) => [
        { title: 'POS', href: '/pos/tables' },
        { title: 'Meseros', href: '/pos/waiters' },
        { title: props.waiter ? props.waiter.name : 'Nuevo Mesero', href: '#' },
    ],
};
