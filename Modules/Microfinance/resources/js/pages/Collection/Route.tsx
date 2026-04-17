import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { CheckCircle, MapPin, MessageCircle, Phone, XCircle } from 'lucide-react';
import { useState } from 'react';

const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Stop {
    id: number; sort_order: number; status: string; amount_due: number; days_overdue: number;
    collected_amount: number; notes?: string; visited_at?: string;
    latitude?: number; longitude?: number;
    client: { id: number; first_name: string; last_name: string; phone_mobile?: string; phone_whatsapp?: string; address?: string };
    loan: { id: number; loan_number: string; product: { name: string }; payment_frequency: string };
}
interface Route { id: number; route_date: string; status: string; total_stops: number; visited_stops: number; expected_amount: number; collected_amount: number; stops: Stop[] }
interface Props { route: Route; date: string }

const STOP_COLORS: Record<string, string> = {
    pending: 'border-gray-200 bg-white', collected: 'border-green-200 bg-green-50',
    promise: 'border-yellow-200 bg-yellow-50', not_found: 'border-gray-200 bg-gray-50', partial: 'border-blue-200 bg-blue-50',
};

export default function CollectionRoute({ route, date }: Props) {
    const [active, setActive] = useState<Stop | null>(null);
    const [amount, setAmount]   = useState('');
    const [resultStatus, setResultStatus] = useState('collected');
    const [notes, setNotes]     = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Microfinanzas', href: '/microfinance' },
        { title: 'Ruta de cobro', href: '#' },
    ];

    const pendingStops    = route.stops.filter(s => s.status === 'pending');
    const completedStops  = route.stops.filter(s => s.status !== 'pending');
    const collectionPct   = route.expected_amount > 0 ? (route.collected_amount / route.expected_amount * 100).toFixed(1) : '0.0';

    const openStop = (stop: Stop) => {
        setActive(stop);
        setAmount(String(stop.amount_due));
        setResultStatus('collected');
        setNotes('');
    };

    const submitStop = () => {
        if (!active) return;
        router.patch(`/microfinance/collection/stops/${active.id}`, {
            status: resultStatus,
            collected_amount: resultStatus === 'promise' ? 0 : amount,
            notes,
        }, { onSuccess: () => { setActive(null); } });
    };

    const openMap = (stop: Stop) => {
        if (stop.latitude && stop.longitude) {
            window.open(`https://maps.google.com/maps?q=${stop.latitude},${stop.longitude}`, '_blank');
        } else if (stop.client.address) {
            window.open(`https://maps.google.com/maps?q=${encodeURIComponent(stop.client.address)}`, '_blank');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-3 p-3">
                {/* Summary bar */}
                <div className="rounded-xl border bg-white p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-semibold">Ruta del día</h1>
                            <p className="text-xs text-gray-400">{new Date(date + 'T12:00:00').toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">{collectionPct}%</p>
                            <p className="text-xs text-gray-400">L.{fmt(route.collected_amount)} / L.{fmt(route.expected_amount)}</p>
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-2.5 w-full rounded-full bg-gray-100">
                        <div className="h-2.5 rounded-full bg-green-500 transition-all" style={{ width: `${collectionPct}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-gray-400">
                        <span>{route.visited_stops} visitados</span>
                        <span>{route.total_stops - route.visited_stops} pendientes</span>
                    </div>
                </div>

                {/* Pending stops */}
                {pendingStops.length > 0 && (
                    <div>
                        <p className="mb-2 px-1 text-xs font-semibold uppercase text-gray-400">Pendientes ({pendingStops.length})</p>
                        <div className="space-y-2">
                            {pendingStops.map(stop => (
                                <div key={stop.id} className={`rounded-xl border-2 p-4 ${stop.days_overdue >= 3 ? 'border-red-200 bg-red-50/40' : 'border-gray-200 bg-white'}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{stop.client.first_name} {stop.client.last_name}</span>
                                                {stop.days_overdue > 0 && (
                                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">+{stop.days_overdue}d mora</span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-xs text-gray-500">{stop.loan.loan_number} · {stop.loan.product.name}</p>
                                            {stop.client.address && <p className="mt-0.5 text-xs text-gray-400">{stop.client.address}</p>}
                                        </div>
                                        <div className="ml-3 text-right">
                                            <p className="text-xl font-bold text-gray-800">L.{fmt(stop.amount_due)}</p>
                                        </div>
                                    </div>
                                    {/* Action buttons */}
                                    <div className="mt-3 flex gap-2">
                                        <button onClick={() => openStop(stop)}
                                            className="flex-1 rounded-lg bg-black py-2.5 text-sm font-medium text-white">
                                            Registrar cobro
                                        </button>
                                        <button onClick={() => openMap(stop)} className="rounded-lg border p-2.5 hover:bg-gray-50">
                                            <MapPin className="h-5 w-5 text-gray-500" />
                                        </button>
                                        {stop.client.phone_mobile && (
                                            <a href={`tel:${stop.client.phone_mobile}`} className="rounded-lg border p-2.5 hover:bg-gray-50">
                                                <Phone className="h-5 w-5 text-gray-500" />
                                            </a>
                                        )}
                                        {stop.client.phone_whatsapp && (
                                            <a href={`https://wa.me/${stop.client.phone_whatsapp?.replace(/\D/g,'')}`} target="_blank" className="rounded-lg border p-2.5 hover:bg-gray-50">
                                                <MessageCircle className="h-5 w-5 text-green-500" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Completed stops */}
                {completedStops.length > 0 && (
                    <div>
                        <p className="mb-2 px-1 text-xs font-semibold uppercase text-gray-400">Completados ({completedStops.length})</p>
                        <div className="space-y-1.5">
                            {completedStops.map(stop => (
                                <div key={stop.id} className={`flex items-center justify-between rounded-xl border p-3 ${STOP_COLORS[stop.status]}`}>
                                    <div className="flex items-center gap-2">
                                        {stop.status === 'collected' ? <CheckCircle className="h-5 w-5 text-green-500" /> : stop.status === 'not_found' ? <XCircle className="h-5 w-5 text-gray-400" /> : <div className="h-5 w-5 rounded-full border-2 border-yellow-400 bg-yellow-100" />}
                                        <div>
                                            <p className="text-sm font-medium">{stop.client.first_name} {stop.client.last_name}</p>
                                            {stop.notes && <p className="text-xs text-gray-400">{stop.notes}</p>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {stop.collected_amount > 0 && <p className="font-bold text-green-600">L.{fmt(stop.collected_amount)}</p>}
                                        <p className="text-xs text-gray-400 capitalize">{stop.status === 'collected' ? 'Cobrado' : stop.status === 'promise' ? 'Promesa' : stop.status === 'not_found' ? 'No encontrado' : 'Parcial'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {route.stops.length === 0 && (
                    <div className="flex flex-1 flex-col items-center justify-center text-gray-400">
                        <CheckCircle className="mb-3 h-12 w-12 text-green-300" />
                        <p>No hay cobros programados para hoy</p>
                    </div>
                )}
            </div>

            {/* Stop action modal */}
            {active && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
                    <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
                        <h3 className="mb-1 font-semibold">{active.client.first_name} {active.client.last_name}</h3>
                        <p className="mb-4 text-xs text-gray-400">Cuota: L.{fmt(active.amount_due)} · {active.loan.loan_number}</p>

                        {/* Result selector */}
                        <div className="mb-4 grid grid-cols-4 gap-2">
                            {[['collected','Cobrado','bg-green-500'], ['partial','Parcial','bg-blue-500'], ['promise','Promesa','bg-yellow-500'], ['not_found','No enc.','bg-gray-400']].map(([val, label, color]) => (
                                <button key={val} type="button" onClick={() => setResultStatus(val)}
                                    className={`rounded-lg py-2 text-xs font-medium text-white ${resultStatus === val ? color : 'bg-gray-200 text-gray-600'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {resultStatus !== 'not_found' && resultStatus !== 'promise' && (
                            <div className="mb-3">
                                <label className="mb-1 block text-xs font-medium text-gray-600">Monto cobrado (L.)</label>
                                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                                    className="w-full rounded-xl border px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="mb-1 block text-xs font-medium text-gray-600">Notas (opcional)</label>
                            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="Observaciones..."
                                className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none" />
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setActive(null)} className="flex-1 rounded-xl border py-3 text-sm font-medium hover:bg-gray-50">Cancelar</button>
                            <button onClick={submitStop} className="flex-1 rounded-xl bg-black py-3 text-sm font-medium text-white hover:bg-gray-900">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
