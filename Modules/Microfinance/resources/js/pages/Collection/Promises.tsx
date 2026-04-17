import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
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
const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700', kept: 'bg-green-100 text-green-700',
    broken: 'bg-red-100 text-red-700', partial: 'bg-blue-100 text-blue-700',
};

export default function CollectionPromises({ promises, filters }: Props) {
    const [status, setStatus] = useState(filters.status ?? 'pending');
    const [actionId, setActionId] = useState<number | null>(null);
    const [newStatus, setNewStatus] = useState('kept');
    const [notes, setNotes] = useState('');

    const filter = (s: string) => { setStatus(s); router.get('/microfinance/collection/promises', { status: s }, { preserveState: true, replace: true }); };

    const submit = () => {
        if (!actionId) return;
        router.patch(`/microfinance/collection/promises/${actionId}`, { status: newStatus, notes },
            { onSuccess: () => { setActionId(null); setNotes(''); } });
    };

    const pending  = promises.filter(p => p.status === 'pending');
    const resolved = promises.filter(p => p.status !== 'pending');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Promesas de pago</h1>
                    <div className="flex gap-1">
                        {['pending','kept','broken','partial'].map(s => (
                            <button key={s} onClick={() => filter(s)}
                                className={`rounded px-3 py-1 text-xs font-medium ${status === s ? 'bg-black text-white' : 'border hover:bg-gray-50'}`}>
                                {STATUS_LABEL[s]}
                            </button>
                        ))}
                    </div>
                </div>

                {pending.length > 0 && status === 'pending' && (
                    <div className="space-y-2">
                        <p className="px-1 text-xs font-semibold uppercase text-gray-400">Pendientes de hoy ({pending.length})</p>
                        {pending.map(p => (
                            <div key={p.id} className="rounded-xl border-2 border-yellow-200 bg-yellow-50/40 p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold">{p.loan.client.first_name} {p.loan.client.last_name}</p>
                                        <p className="text-xs text-gray-500">{p.loan.loan_number}</p>
                                        <p className="mt-1 text-xs text-gray-400">Fecha: {new Date(p.promise_date + 'T12:00:00').toLocaleDateString('es-HN')}</p>
                                        {p.notes && <p className="mt-0.5 text-xs italic text-gray-400">"{p.notes}"</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gray-800">L.{fmt(p.promise_amount)}</p>
                                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <button onClick={() => { setActionId(p.id); setNewStatus('kept'); setNotes(''); }}
                                        className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700">
                                        <CheckCircle className="h-4 w-4" /> Cumplida
                                    </button>
                                    <button onClick={() => { setActionId(p.id); setNewStatus('partial'); setNotes(''); }}
                                        className="flex items-center gap-1 rounded-lg border border-blue-400 px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50">
                                        <Clock className="h-4 w-4" /> Parcial
                                    </button>
                                    <button onClick={() => { setActionId(p.id); setNewStatus('broken'); setNotes(''); }}
                                        className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">
                                        <XCircle className="h-4 w-4" /> Incumplida
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {(status !== 'pending' || resolved.length > 0) && (
                    <div className="space-y-1.5">
                        {status !== 'pending' && <p className="px-1 text-xs font-semibold uppercase text-gray-400">Historial</p>}
                        {(status !== 'pending' ? promises : resolved).map(p => (
                            <div key={p.id} className="flex items-center justify-between rounded-xl border bg-white p-3">
                                <div className="flex items-center gap-3">
                                    {p.status === 'kept' ? <CheckCircle className="h-5 w-5 text-green-500" /> :
                                        p.status === 'broken' ? <XCircle className="h-5 w-5 text-red-400" /> :
                                        <Clock className="h-5 w-5 text-blue-400" />}
                                    <div>
                                        <p className="text-sm font-medium">{p.loan.client.first_name} {p.loan.client.last_name}</p>
                                        <p className="text-xs text-gray-400">{p.loan.loan_number} · {new Date(p.promise_date + 'T12:00:00').toLocaleDateString('es-HN')}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">L.{fmt(p.promise_amount)}</p>
                                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                                </div>
                            </div>
                        ))}
                        {promises.length === 0 && <p className="py-10 text-center text-gray-400">Sin promesas</p>}
                    </div>
                )}
            </div>

            {actionId !== null && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
                    <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
                        <h3 className="mb-4 font-semibold">Actualizar promesa</h3>
                        <div className="mb-4 grid grid-cols-3 gap-2">
                            {[['kept','Cumplida','bg-green-600'],['partial','Parcial','bg-blue-500'],['broken','Incumplida','bg-red-500']].map(([v,l,c]) => (
                                <button key={v} onClick={() => setNewStatus(v)}
                                    className={`rounded-lg py-2 text-xs font-medium text-white ${newStatus === v ? c : 'bg-gray-200 text-gray-600'}`}>{l}</button>
                            ))}
                        </div>
                        <div className="mb-4">
                            <label className="mb-1 block text-xs font-medium text-gray-600">Notas</label>
                            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..."
                                className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setActionId(null)} className="flex-1 rounded-xl border py-3 text-sm font-medium hover:bg-gray-50">Cancelar</button>
                            <button onClick={submit} className="flex-1 rounded-xl bg-black py-3 text-sm font-medium text-white">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
