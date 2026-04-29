import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle, Clock, X, XCircle } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Microfinanzas', href: '/microfinance' },
    { title: 'Promesas de pago', href: '#' },
];

const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Promise_ {
    id: number; promise_date: string; promise_amount: number; status: string; notes?: string;
    loan: { id: number; loan_number: string; client: { first_name: string; last_name: string } };
}
interface Props { promises: Promise_[]; filters: Record<string, string> }

const STATUS_LABEL: Record<string, string> = { pending: 'Pendiente', kept: 'Cumplida', broken: 'Incumplida', partial: 'Parcial' };

export default function CollectionPromises({ promises, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'pending');
    const [actionId, setActionId] = useState<number | null>(null);
    const [newStatus, setNewStatus] = useState('kept');
    const [notes, setNotes] = useState('');

    const filter = (s: string) => { setStatusFilter(s); router.get('/microfinance/collection/promises', { status: s }, { preserveState: true, replace: true }); };

    const submit = () => {
        if (!actionId) return;
        router.patch(`/microfinance/collection/promises/${actionId}`, { status: newStatus, notes },
            { onSuccess: () => { setActionId(null); setNotes(''); } });
    };

    const pending  = promises.filter(p => p.status === 'pending');
    const resolved = promises.filter(p => p.status !== 'pending');

    return (
        <>
            <Head title="Promesas de Pago" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="text-xl">Promesas de pago</CardTitle>
                        <div className="flex gap-2 bg-muted p-1 rounded-lg">
                            {['pending','kept','broken','partial'].map(s => (
                                <button key={s} onClick={() => filter(s)}
                                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === s ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:bg-background/50'}`}>
                                    {STATUS_LABEL[s]}
                                </button>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {pending.length > 0 && statusFilter === 'pending' && (
                            <div className="space-y-4 mb-8">
                                <h3 className="text-sm font-semibold text-muted-foreground">Pendientes de hoy ({pending.length})</h3>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {pending.map(p => (
                                        <div key={p.id} className="rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-amber-300">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="font-semibold">{p.loan.client.first_name} {p.loan.client.last_name}</p>
                                                    <p className="text-sm text-muted-foreground">{p.loan.loan_number}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-lg">L.{fmt(p.promise_amount)}</p>
                                                    <Badge variant="outline" className="mt-1 bg-amber-100 text-amber-800 border-transparent hover:bg-amber-100">{STATUS_LABEL[p.status]}</Badge>
                                                </div>
                                            </div>
                                            <div className="mb-4">
                                                <p className="text-sm">Vence: <span className="font-medium">{new Date(p.promise_date + 'T12:00:00').toLocaleDateString('es-HN')}</span></p>
                                                {p.notes && <p className="mt-1 text-xs italic text-muted-foreground">"{p.notes}"</p>}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => { setActionId(p.id); setNewStatus('kept'); setNotes(''); }}>
                                                    <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Cumplida
                                                </Button>
                                                <Button size="sm" variant="outline" className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => { setActionId(p.id); setNewStatus('partial'); setNotes(''); }}>
                                                    <Clock className="mr-1.5 h-3.5 w-3.5" /> Parcial
                                                </Button>
                                                <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50" onClick={() => { setActionId(p.id); setNewStatus('broken'); setNotes(''); }}>
                                                    <XCircle className="mr-1.5 h-3.5 w-3.5" /> Incumplida
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(statusFilter !== 'pending' || resolved.length > 0) && (
                            <div className="space-y-4">
                                {statusFilter !== 'pending' && <h3 className="text-sm font-semibold text-muted-foreground">Historial</h3>}
                                <div className="rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
                                                <th className="px-4 py-3 font-medium">Estado</th>
                                                <th className="px-4 py-3 font-medium">Cliente</th>
                                                <th className="px-4 py-3 font-medium">Préstamo</th>
                                                <th className="px-4 py-3 font-medium">Fecha</th>
                                                <th className="px-4 py-3 font-medium text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {(statusFilter !== 'pending' ? promises : resolved).map(p => (
                                                <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        {p.status === 'kept' ? <Badge className="bg-emerald-500 hover:bg-emerald-600">Cumplida</Badge> :
                                                         p.status === 'broken' ? <Badge variant="destructive">Incumplida</Badge> :
                                                         <Badge className="bg-blue-500 hover:bg-blue-600">Parcial</Badge>}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium">{p.loan.client.first_name} {p.loan.client.last_name}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{p.loan.loan_number}</td>
                                                    <td className="px-4 py-3 text-muted-foreground">{new Date(p.promise_date + 'T12:00:00').toLocaleDateString('es-HN')}</td>
                                                    <td className="px-4 py-3 text-right font-medium">L.{fmt(p.promise_amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {promises.length === 0 && <p className="py-10 text-center text-muted-foreground">No hay promesas con este filtro.</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {actionId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-md shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                            <CardTitle>Actualizar promesa</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setActionId(null)} className="h-6 w-6 rounded-full">
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {[['kept','Cumplida'],['partial','Parcial'],['broken','Incumplida']].map(([v,l]) => (
                                    <Button key={v} onClick={() => setNewStatus(v)} variant={newStatus === v ? 'default' : 'outline'} className="w-full">
                                        {l}
                                    </Button>
                                ))}
                            </div>
                            <div className="space-y-2 mb-6">
                                <Label>Notas</Label>
                                <Input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..." />
                            </div>
                            <Button onClick={submit} className="w-full font-semibold">Confirmar</Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    );
}

CollectionPromises.layout = { breadcrumbs };
