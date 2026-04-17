import { Head } from '@inertiajs/react';
import { Calendar, Car, Droplets } from 'lucide-react';

interface HistoryRow {
    id: number; reference: string; oil_type: string | null; oil_viscosity: string | null;
    odometer_out: number | null; completed_at: string | null;
    next_service_km: number | null; total: string;
}

interface Order {
    reference: string;
    vehicle: { plate: string; make: string; model: string; year: number | null };
    next_service_km: number | null;
    next_service_date: string | null;
    oil_type: string | null;
    oil_viscosity: string | null;
    completed_at: string | null;
}

const OIL_LABELS: Record<string, string> = {
    mineral: 'Mineral', semi_synthetic: 'Semi-Sintético', synthetic: 'Sintético 100%',
};

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: '2-digit' });
}
function fmtKm(n: number | null) { return n ? n.toLocaleString('es-HN') + ' km' : '—'; }

export default function PublicHistory({ order, history }: { order: Order; history: HistoryRow[] }) {
    return (
        <>
            <Head title={`Historial — ${order.vehicle.plate}`} />

            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
                <div className="mx-auto max-w-md space-y-4">

                    {/* Header */}
                    <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm border text-center">
                        <div className="flex justify-center mb-3">
                            <div className="rounded-full bg-blue-100 dark:bg-blue-950 p-3">
                                <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <h1 className="text-xl font-bold font-mono">{order.vehicle.plate}</h1>
                        <p className="text-sm text-muted-foreground">
                            {order.vehicle.make} {order.vehicle.model} {order.vehicle.year ?? ''}
                        </p>
                    </div>

                    {/* Próximo servicio */}
                    {order.next_service_km && (
                        <div className="rounded-2xl bg-green-600 p-5 text-white shadow-sm text-center">
                            <Calendar className="h-5 w-5 mx-auto mb-2 opacity-80" />
                            <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Próximo cambio de aceite</p>
                            <p className="text-3xl font-bold tabular-nums">{fmtKm(order.next_service_km)}</p>
                            {order.next_service_date && (
                                <p className="text-sm opacity-80 mt-1">Estimado: {fmtDate(order.next_service_date)}</p>
                            )}
                            <div className="mt-3 rounded-xl bg-white/20 px-3 py-2 inline-block text-sm">
                                {order.oil_type ? `${OIL_LABELS[order.oil_type]} ${order.oil_viscosity ?? ''}` : '—'}
                            </div>
                        </div>
                    )}

                    {/* Historial */}
                    <div className="rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-sm border">
                        <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                            <Droplets className="h-4 w-4 text-blue-500" /> Historial de servicios
                        </h2>
                        <div className="space-y-3">
                            {history.map((h, i) => (
                                <div key={h.id} className={`rounded-xl p-3 ${i === 0 ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200' : 'bg-gray-50 dark:bg-gray-800'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-mono text-xs font-semibold">{h.reference}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {h.oil_type ? `${OIL_LABELS[h.oil_type]} ${h.oil_viscosity ?? ''}` : '—'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">{fmtDate(h.completed_at)}</p>
                                            {h.odometer_out && <p className="text-xs font-mono mt-0.5">{fmtKm(h.odometer_out)}</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-center text-xs text-muted-foreground pb-4">
                        Powered by OneClick Lubricentro
                    </p>
                </div>
            </div>
        </>
    );
}

// Sin layout — página pública standalone
PublicHistory.layout = null;
