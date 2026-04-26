import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
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
    const { props } = usePage<{ flash?: { success?: string } }>();

    function destroy(waiter: Waiter) {
        if (!confirm(`¿Eliminar mesero "${waiter.name}"?`)) return;
        router.delete(`/pos/waiters/${waiter.id}`);
    }

    return (
        <AppLayout breadcrumbs={[
            { title: 'POS', href: '/pos/tables' },
            { title: 'Meseros', href: '#' },
        ]}>
            <Head title="Meseros" />

            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Meseros</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">{waiters.length} mesero{waiters.length !== 1 ? 's' : ''} registrado{waiters.length !== 1 ? 's' : ''}</p>
                    </div>
                    <Link href="/pos/waiters/create">
                        <Button size="sm" className="gap-1.5">
                            <Plus className="h-4 w-4" />
                            Nuevo mesero
                        </Button>
                    </Link>
                </div>

                {props.flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        {props.flash.success}
                    </div>
                )}

                {waiters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center text-muted-foreground">
                        <User className="h-10 w-10 mb-3 opacity-20" />
                        <p className="font-medium">No hay meseros registrados</p>
                        <p className="text-sm mt-1">Agrega meseros para asignarlos a las mesas.</p>
                        <Link href="/pos/waiters/create" className="mt-4">
                            <Button size="sm" variant="outline" className="gap-1.5">
                                <Plus className="h-4 w-4" />Agregar primer mesero
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="rounded-lg border overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-2.5 text-left font-medium">Nombre</th>
                                    <th className="px-4 py-2.5 text-left font-medium">Código</th>
                                    <th className="px-4 py-2.5 text-left font-medium">Estado</th>
                                    <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {waiters.map(waiter => (
                                    <tr key={waiter.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">{waiter.name}</td>
                                        <td className="px-4 py-3 font-mono text-muted-foreground text-xs">
                                            {waiter.code ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {waiter.active
                                                ? <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-300">Activo</Badge>
                                                : <Badge variant="outline" className="text-muted-foreground">Inactivo</Badge>
                                            }
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <Link href={`/pos/waiters/${waiter.id}/edit`}>
                                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                                <Button size="sm" variant="ghost"
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                    onClick={() => destroy(waiter)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
