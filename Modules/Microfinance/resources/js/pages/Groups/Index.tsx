import { type BreadcrumbItem } from '@/types';
import { Head,  router  } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Microfinanzas', href: '/microfinance' },
    { title: 'Grupos Solidarios', href: '/microfinance/groups' },
];

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700', blocked: 'bg-red-100 text-red-700',
    forming: 'bg-blue-100 text-blue-700', dissolved: 'bg-gray-100 text-gray-400',
};
const STATUS_LABELS: Record<string, string> = {
    active: 'Activo', blocked: 'Bloqueado', forming: 'En formación', dissolved: 'Disuelto',
};

interface Group {
    id: number; group_number: string; name: string; status: string; cycle_number: number;
    is_blocked: boolean; blocked_reason?: string; members_count: number;
    meeting_day?: string; meeting_time?: string;
}
interface Props {
    groups: { data: Group[]; links: any[] };
    filters: Record<string, string>;
}

export default function GroupsIndex({ groups, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const filter = () => router.get('/microfinance/groups', { search, status }, { preserveState: true, replace: true });

    return (
        <>
            <Head title="Microfinanzas" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Grupos Solidarios</h1>
                    <button onClick={() => router.visit('/microfinance/groups/create')}
                        className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-900">+ Nuevo grupo</button>
                </div>

                <div className="flex gap-2">
                    <input type="text" placeholder="N° grupo o nombre..." value={search}
                        onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && filter()}
                        className="w-56 rounded border px-3 py-1.5 text-sm focus:outline-none" />
                    <select value={status} onChange={e => setStatus(e.target.value)} className="rounded border px-3 py-1.5 text-sm">
                        <option value="">Todos</option>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <button onClick={filter} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">Filtrar</button>
                </div>

                <div className="overflow-hidden rounded-lg border bg-white">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">N° Grupo</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Nombre</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Miembros</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Ciclo</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Reunión</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {groups.data.map(g => (
                                <tr key={g.id} className={`cursor-pointer hover:bg-gray-50 ${g.is_blocked ? 'bg-red-50/30' : ''}`}
                                    onClick={() => router.visit(`/microfinance/groups/${g.id}`)}>
                                    <td className="px-4 py-3 font-mono text-xs font-medium">{g.group_number}</td>
                                    <td className="px-4 py-3 font-medium">{g.name}</td>
                                    <td className="px-4 py-3 text-center text-sm font-bold">{g.members_count}</td>
                                    <td className="px-4 py-3 text-center text-xs">{g.cycle_number}</td>
                                    <td className="px-4 py-3 text-xs capitalize text-gray-500">
                                        {g.meeting_day ?? '—'}{g.meeting_time ? ` ${g.meeting_time}` : ''}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[g.status]}`}>
                                            {g.is_blocked && '🔒 '}{STATUS_LABELS[g.status]}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {groups.data.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-gray-400">Sin grupos</td></tr>}
                        </tbody>
                    </table>
                </div>

                {groups.links && (
                    <div className="flex justify-center gap-1">
                        {groups.links.map((l: any, i: number) => (
                            <button key={i} disabled={!l.url}
                                onClick={() => l.url && router.visit(l.url, { preserveState: true })}
                                className={`rounded px-3 py-1 text-sm ${l.active ? 'bg-black text-white' : 'border hover:bg-gray-50'} disabled:opacity-40`}
                                dangerouslySetInnerHTML={{ __html: l.label }} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

GroupsIndex.layout = { breadcrumbs };
