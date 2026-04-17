import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { Download, FileText } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Microfinanzas', href: '/microfinance' },
    { title: 'Buró de crédito', href: '#' },
];
const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Snapshot {
    id: number; generated_at: string; report_type: string; record_count: number;
    file_path: string; generated_by_user?: { name: string };
}
interface Props { snapshots: Snapshot[] }

export default function ReportsCreditBureau({ snapshots }: Props) {
    const [showModal, setShowModal] = useState(false);
    const { data, setData, post, processing } = useForm({ report_type: 'equifax', as_of_date: new Date().toISOString().split('T')[0] });

    const generate = () => post('/microfinance/reports/credit-bureau', { onSuccess: () => setShowModal(false) });

    const download = (id: number) => window.open(`/microfinance/reports/credit-bureau/${id}/download`, '_blank');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Archivos Buró de Crédito</h1>
                    <button onClick={() => setShowModal(true)} className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-900">
                        + Generar archivo
                    </button>
                </div>

                <div className="overflow-hidden rounded-lg border bg-white">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Fecha</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Tipo</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Registros</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Generado por</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {snapshots.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">{new Date(s.generated_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium capitalize">{s.report_type}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono">{s.record_count.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{s.generated_by_user?.name ?? '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => download(s.id)}
                                            className="flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-gray-50">
                                            <Download className="h-3.5 w-3.5" /> Descargar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {snapshots.length === 0 && (
                                <tr><td colSpan={5} className="py-10 text-center text-gray-400">Sin archivos generados</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="mb-4 font-semibold">Generar archivo de buró</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Buró</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['equifax','transunion'].map(t => (
                                        <button key={t} type="button" onClick={() => setData('report_type', t)}
                                            className={`rounded-lg py-2 text-sm font-medium capitalize ${data.report_type === t ? 'bg-black text-white' : 'border hover:bg-gray-50'}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">Fecha de corte</label>
                                <input type="date" value={data.as_of_date} onChange={e => setData('as_of_date', e.target.value)}
                                    className="w-full rounded border px-3 py-2 text-sm focus:outline-none" />
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button onClick={() => setShowModal(false)} className="flex-1 rounded-xl border py-2.5 text-sm hover:bg-gray-50">Cancelar</button>
                            <button onClick={generate} disabled={processing}
                                className="flex-1 rounded-xl bg-black py-2.5 text-sm font-medium text-white disabled:opacity-50">
                                {processing ? 'Generando...' : 'Generar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
