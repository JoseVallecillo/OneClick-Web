import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
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
        <AppLayout breadcrumbs={[
            { title: 'POS', href: '/pos/tables' },
            { title: 'Meseros', href: '/pos/waiters' },
            { title: isEdit ? waiter!.name : 'Nuevo mesero', href: '#' },
        ]}>
            <Head title={isEdit ? `Editar ${waiter!.name}` : 'Nuevo mesero'} />

            <div className="mx-auto max-w-md p-6">
                <h1 className="text-xl font-bold mb-6">
                    {isEdit ? `Editar mesero` : 'Nuevo mesero'}
                </h1>

                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Nombre completo</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Ej. Juan Pérez"
                            autoFocus
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="code">Código / Abreviatura <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                        <Input
                            id="code"
                            value={data.code}
                            onChange={e => setData('code', e.target.value)}
                            placeholder="Ej. JP, M01"
                            maxLength={20}
                        />
                        {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            id="active"
                            type="checkbox"
                            checked={data.active}
                            onChange={e => setData('active', e.target.checked)}
                            className="h-4 w-4 rounded border-input"
                        />
                        <Label htmlFor="active" className="cursor-pointer">Mesero activo</Label>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={processing} className="flex-1">
                            {processing ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear mesero'}
                        </Button>
                        <Link href="/pos/waiters">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
