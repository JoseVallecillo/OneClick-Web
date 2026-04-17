import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router } from '@inertiajs/react';
import { MapPin, Star } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Microfinanzas', href: '/microfinance' },
    { title: 'Clientes', href: '/microfinance/clients' },
];

const scoreColor = (s: number) => s >= 70 ? 'text-green-600' : s >= 50 ? 'text-yellow-600' : 'text-red-600';
const scoreBar = (s: number) => s >= 70 ? 'bg-green-500' : s >= 50 ? 'bg-yellow-500' : 'bg-red-500';

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700', prospect: 'bg-blue-100 text-blue-700',
    blacklisted: 'bg-red-100 text-red-700', inactive: 'bg-gray-100 text-gray-400',
};
const STATUS_LABELS: Record<string, string> = {
    active: 'Activo', prospect: 'Prospecto', blacklisted: 'Bloqueado', inactive: 'Inactivo',
};

interface Client {
    id: number; client_number: string; first_name: string; last_name: string;
    identity_number: string; business_type?: string; phone_mobile?: string;
    internal_score: number; completed_cycles: number; status: string;
    latitude?: number; longitude?: number;
}
interface Props {
    clients: { data: Client[]; links: any[] };
    filters: Record<string, string>;
    summary: { total: number; active: number; prospect: number; blacklisted: number };
}

export default function ClientsIndex({ clients, filters, summary }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const filter = () => router.get('/microfinance/clients', { search, status }, { preserveState: true, replace: true });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Clientes</h1>
                    <button onClick={() => router.visit('/microfinance/clients/create')}
                        className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-900">+ Nuevo cliente</button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: 'Total', value: summary.total, color: 'text-gray-700' },
                        { label: 'Activos', value: summary.active, color: 'text-green-600' },
                        { label: 'Prospectos', value: summary.prospect, color: 'text-blue-600' },
                        { label: 'Bloqueados', value: summary.blacklisted, color: 'text-red-600' },
                    ].map((k) => (
                        <div key={k.label} className="rounded-lg border bg-white p-3">
                            <p className="text-xs text-gray-400">{k.label}</p>
                            <p className={`mt-1 text-xl font-bold ${k.color}`}>{k.value}</p>
                        </div>
                    ))}
                </div>

                <div className="flex gap-2">
                    <input type="text" placeholder="Nombre, DNI, N° cliente..." value={search}
                        onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && filter()}
                        className="w-64 rounded border px-3 py-1.5 text-sm focus:outline-none" />
                    <select value={status} onChange={e => setStatus(e.target.value)} className="rounded border px-3 py-1.5 text-sm">
                        <option value="">Todos los estados</option>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <button onClick={filter} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">Filtrar</button>
                </div>

                <div className="overflow-hidden rounded-lg border bg-white">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">N° Cliente</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Nombre</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">DNI</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Negocio</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Score</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Ciclos</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Geo</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {clients.data.map((c) => (
                                <tr key={c.id} className="cursor-pointer hover:bg-gray-50"
                                    onClick={() => router.visit(`/microfinance/clients/${c.id}`)}>
                                    <td className="px-4 py-3 font-mono text-xs font-medium">{c.client_number}</td>
                                    <td className="px-4 py-3 font-medium">{c.first_name} {c.last_name}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">{c.identity_number}</td>
                                    <td className="px-4 py-3 text-xs capitalize text-gray-500">{c.business_type ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-16 rounded-full bg-gray-100">
                                                <div className={`h-1.5 rounded-full ${scoreBar(c.internal_score)}`}
                                                    style={{ width: `${c.internal_score}%` }} />
                                            </div>
                                            <span className={`text-xs font-bold ${scoreColor(c.internal_score)}`}>{c.internal_score}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs font-bold">{c.completed_cycles}</td>
                                    <td className="px-4 py-3 text-center">
                                        {c.latitude && c.longitude
                                            ? <MapPin className="mx-auto h-4 w-4 text-green-500" />
                                            : <span className="text-xs text-gray-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                                            {STATUS_LABELS[c.status]}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {clients.data.length === 0 && (
                                <tr><td colSpan={8} className="py-10 text-center text-gray-400">Sin clientes</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {clients.links && (
                    <div className="flex justify-center gap-1">
                        {clients.links.map((l: any, i: number) => (
                            <button key={i} disabled={!l.url}
                                onClick={() => l.url && router.visit(l.url, { preserveState: true })}
                                className={`rounded px-3 py-1 text-sm ${l.active ? 'bg-black text-white' : 'border hover:bg-gray-50'} disabled:opacity-40`}
                                dangerouslySetInnerHTML={{ __html: l.label }} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
