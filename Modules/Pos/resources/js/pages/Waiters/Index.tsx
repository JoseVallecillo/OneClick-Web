import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2, User } from 'lucide-react';

interface Waiter {
    id: number;
    name: string;
    code: string | null;
    active: boolean;
}

interface Props { waiters: Waiter[] }

export default function WaitersIndex({ waiters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    function destroy(waiter: Waiter) {
        if (!confirm(`¿Eliminar al mesero "${waiter.name}"? Esta acción no se puede deshacer.`)) return;
        router.delete(`/pos/waiters/${waiter.id}`);
    }

    return (
        <>
            <Head title="Meseros" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
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

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="text-xl font-bold">Meseros</h1>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    {waiters.length} mesero{waiters.length !== 1 ? 's' : ''} registrado{waiters.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link href="/pos/waiters/create">
                                    <Button size="sm" className="flex items-center gap-1.5 h-9">
                                        <Plus className="h-4 w-4" />
                                        Nuevo mesero
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {waiters.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <User className="h-8 w-8 opacity-40" />
                                <p className="text-sm">Aún no hay meseros registrados. Agrega el primero para asignarlos a las mesas.</p>
                                <Link href="/pos/waiters/create">
                                    <Button variant="outline" size="sm">Agregar primer mesero</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 pr-4 font-medium">Nombre</th>
                                            <th className="pb-2 pr-4 font-medium">Código</th>
                                            <th className="pb-2 pr-4 font-medium">Estado</th>
                                            <th className="pb-2 pr-4 font-medium">Editar</th>
                                            <th className="pb-2 font-medium">Eliminar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {waiters.map(waiter => (
                                            <tr key={waiter.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                <td className="py-2 pr-4 font-medium">{waiter.name}</td>
                                                <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                                                    {waiter.code ?? '—'}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    <Badge variant={waiter.active ? 'secondary' : 'destructive'} className={waiter.active ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : ''}>
                                                        {waiter.active ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </td>
                                                <td className="py-2 pr-4">
                                                    <Link href={`/pos/waiters/${waiter.id}/edit`}>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </Link>
                                                </td>
                                                <td className="py-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                        onClick={() => destroy(waiter)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

WaitersIndex.layout = {
    breadcrumbs: [
        { title: 'POS', href: '/pos/tables' },
        { title: 'Meseros', href: '/pos/waiters' },
    ],
};
