import { type BreadcrumbItem } from '@/types';
import { Head,  router  } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Microfinanzas', href: '/microfinance' },
    { title: 'Alertas AML', href: '#' },
];
const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Alert {
    id: number; alert_date: string; alert_type: string; risk_level: string; amount_hnl: number;
    amount_usd?: number; description?: string; status: string; reviewed_at?: string; reviewer_notes?: string;
    loan?: { loan_number: string };
    client: { first_name: string; last_name: string; client_number: string };
}
interface Props { alerts: { data: Alert[] }; filters: Record<string, string> }

const LEVEL_COLORS: Record<string, string> = {
    high:   'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-orange-100 text-orange-700 border-orange-200',
    low:    'bg-yellow-100 text-yellow-700 border-yellow-200',
};
const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600', reviewed: 'bg-green-100 text-green-700', reported: 'bg-red-100 text-red-700',
};

export default function ReportsAmlAlerts({ alerts, filters }: Props) {
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'pending');
    const [selected, setSelected] = useState<Alert | null>(null);
    const [notes, setNotes] = useState('');
    const [action, setAction] = useState('reviewed');

    const filter = (s: string) => {
        setStatusFilter(s);
        router.get('/microfinance/reports/aml-alerts', { status: s }, { preserveState: true, replace: true });
    };

    const submit = () => {
        if (!selected) return;
        router.patch(`/microfinance/reports/aml-alerts/${selected.id}`, { status: action, reviewer_notes: notes },
            { onSuccess: () => { setSelected(null); setNotes(''); } });
    };

    return (
        <>
            <Head title="Microfinanzas" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Alertas AML / Prevención de Lavado</h1>
                    <div className="flex gap-1">
                        {['pending','reviewed','reported'].map(s => (
                            <button key={s} onClick={() => filter(s)}
                                className={`rounded px-3 py-1 text-xs font-medium ${statusFilter === s ? 'bg-black text-white' : 'border hover:bg-gray-50'}`}>
                                {s === 'pending' ? 'Pendientes' : s === 'reviewed' ? 'Revisadas' : 'Reportadas'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    {alerts.data.map(alert => (
                        <div key={alert.id} className={`rounded-xl border p-4 ${LEVEL_COLORS[alert.risk_level]}`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className={`mt-0.5 h-5 w-5 ${alert.risk_level === 'high' ? 'text-red-500' : alert.risk_level === 'medium' ? 'text-orange-500' : 'text-yellow-500'}`} />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">{alert.client.first_name} {alert.client.last_name}</p>
                                            <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium capitalize">{alert.risk_level}</span>
                                        </div>
                                        <p className="text-xs opacity-80">{alert.client.client_number}{alert.loan && ` · ${alert.loan.loan_number}`}</p>
                                        <p className="mt-1 text-xs">{alert.description}</p>
                                        <p className="mt-0.5 text-xs opacity-60">{new Date(alert.alert_date).toLocaleDateString('es-HN')}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">L.{fmt(alert.amount_hnl)}</p>
                                    {alert.amount_usd && <p className="text-xs opacity-70">${fmt(alert.amount_usd)} USD</p>}
                                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[alert.status]}`}>
                                        {alert.status === 'pending' ? 'Pendiente' : alert.status === 'reviewed' ? 'Revisada' : 'Reportada'}
                                    </span>
                                </div>
                            </div>
                            {alert.status === 'pending' && (
                                <button onClick={() => { setSelected(alert); setNotes(''); setAction('reviewed'); }}
                                    className="mt-3 rounded-lg bg-white/70 px-3 py-1.5 text-xs font-medium hover:bg-white">
                                    Revisar
                                </button>
                            )}
                            {alert.reviewer_notes && (
                                <p className="mt-2 text-xs italic opacity-70">Nota: {alert.reviewer_notes}</p>
                            )}
                        </div>
                    ))}
                    {alerts.data.length === 0 && (
                        <div className="flex flex-1 items-center justify-center py-16 text-gray-400">
                            <p>Sin alertas {statusFilter === 'pending' ? 'pendientes' : ''}</p>
                        </div>
                    )}
                </div>
            </div>

            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="mb-1 font-semibold">Revisar alerta AML</h3>
                        <p className="mb-4 text-sm text-gray-500">{selected.client.first_name} {selected.client.last_name} — L.{fmt(selected.amount_hnl)}</p>

                        <div className="mb-4 grid grid-cols-2 gap-2">
                            {[['reviewed','Revisada (sin acción)'],['reported','Reportar a UAFI']].map(([v,l]) => (
                                <button key={v} type="button" onClick={() => setAction(v)}
                                    className={`rounded-lg py-2 text-xs font-medium ${action === v ? (v === 'reported' ? 'bg-red-600 text-white' : 'bg-green-600 text-white') : 'border hover:bg-gray-50'}`}>
                                    {l}
                                </button>
                            ))}
                        </div>

                        <div className="mb-4">
                            <label className="mb-1 block text-xs font-medium text-gray-600">Notas del revisor</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                                className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none" />
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => setSelected(null)} className="flex-1 rounded-xl border py-2.5 text-sm hover:bg-gray-50">Cancelar</button>
                            <button onClick={submit} className="flex-1 rounded-xl bg-black py-2.5 text-sm font-medium text-white">Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

ReportsAmlAlerts.layout = { breadcrumbs };
