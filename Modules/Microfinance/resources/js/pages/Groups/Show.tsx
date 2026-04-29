import { type BreadcrumbItem } from '@/types';
import { Head,  router, useForm  } from '@inertiajs/react';
import { useState } from 'react';

const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Member {
    id: number; group_id: number; role: string; status: string; joined_at: string;
    client: { id: number; client_number: string; first_name: string; last_name: string; internal_score: number;
        loans: Array<{ principal_balance: string; days_overdue: number; par_category: string; status: string }> };
}
interface Group {
    id: number; group_number: string; name: string; status: string; cycle_number: number;
    is_blocked: boolean; blocked_reason?: string; blocking_threshold_days: number;
    meeting_day?: string; meeting_time?: string; meeting_location?: string;
    members: Member[];
}
interface Props { group: Group }

const PAR_COLOR: Record<string, string> = {
    current: 'text-green-600', par1: 'text-yellow-600', par30: 'text-orange-600', par60: 'text-red-600', par90: 'text-red-800',
};

const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Microfinanzas', href: '/microfinance' },
        { title: 'Grupos', href: '/microfinance/groups' },
        { title: group.name, href: '#' },
    ];

export default function GroupShow({ group }: Props) {
    const [showAddMember, setShowAddMember] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [results, setResults] = useState<any[]>([]);


    const searchClients = async (q: string) => {
        setMemberSearch(q);
        if (q.length < 2) { setResults([]); return; }
        const res = await fetch(`/microfinance/clients/lookup?q=${encodeURIComponent(q)}`);
        setResults(await res.json());
    };

    const addMember = (clientId: number) => {
        router.post(`/microfinance/groups/${group.id}/add-member`, { client_id: clientId }, { onSuccess: () => { setShowAddMember(false); setMemberSearch(''); setResults([]); } });
    };

    const removeMember = (clientId: number) => {
        if (!confirm('¿Retirar este miembro del grupo?')) return;
        router.post(`/microfinance/groups/${group.id}/remove-member`, { client_id: clientId });
    };

    const activeMembers = group.members.filter(m => m.status === 'active');

    return (
        <>
            <Head title="Microfinanzas" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold">{group.name}</h1>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${group.is_blocked ? 'bg-red-100 text-red-700' : group.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {group.is_blocked ? '🔒 Bloqueado' : group.status === 'active' ? 'Activo' : group.status}
                            </span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {group.group_number} · Ciclo {group.cycle_number} · {activeMembers.length} miembros
                            {group.meeting_day && ` · Reunión: ${group.meeting_day} ${group.meeting_time ?? ''}`}
                        </p>
                    </div>
                    {activeMembers.length < 7 && (
                        <button onClick={() => setShowAddMember(true)}
                            className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">+ Agregar miembro</button>
                    )}
                </div>

                {/* Blocked banner */}
                {group.is_blocked && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <strong>Grupo bloqueado:</strong> {group.blocked_reason}
                        <br /><span className="text-xs">Los desembolsos están suspendidos hasta que todos los miembros estén al día (umbral: {group.blocking_threshold_days} días).</span>
                    </div>
                )}

                {/* Members table */}
                <div className="overflow-hidden rounded-lg border bg-white">
                    <div className="border-b px-4 py-3">
                        <h2 className="text-sm font-semibold text-gray-700">Miembros del grupo ({activeMembers.length}/7)</h2>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="border-b bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Cliente</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Rol</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Score</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500">Deuda activa</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Estado crédito</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {group.members.filter(m => m.status === 'active').map(m => {
                                const activeLoans = m.client.loans.filter(l => ['disbursed','current','delinquent'].includes(l.status));
                                const totalDebt   = activeLoans.reduce((s, l) => s + Number(l.principal_balance), 0);
                                const worstPar    = activeLoans.reduce((worst, l) => {
                                    const rank: Record<string, number> = { current: 0, par1: 1, par30: 2, par60: 3, par90: 4 };
                                    return (rank[l.par_category] ?? 0) > (rank[worst] ?? 0) ? l.par_category : worst;
                                }, 'current');
                                const maxOverdue  = Math.max(0, ...activeLoans.map(l => l.days_overdue));

                                return (
                                    <tr key={m.id} className={maxOverdue >= group.blocking_threshold_days ? 'bg-red-50/30' : ''}>
                                        <td className="px-4 py-3">
                                            <div className="cursor-pointer font-medium hover:underline" onClick={() => router.visit(`/microfinance/clients/${m.client.id}`)}>
                                                {m.client.first_name} {m.client.last_name}
                                            </div>
                                            <div className="text-xs text-gray-400">{m.client.client_number}</div>
                                        </td>
                                        <td className="px-4 py-3 capitalize text-xs text-gray-500">{m.role}</td>
                                        <td className={`px-4 py-3 text-center text-sm font-bold ${m.client.internal_score >= 70 ? 'text-green-600' : m.client.internal_score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {m.client.internal_score}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            {totalDebt > 0 ? `L.${fmt(totalDebt)}` : '—'}
                                        </td>
                                        <td className={`px-4 py-3 text-center text-xs font-bold ${PAR_COLOR[worstPar]}`}>
                                            {maxOverdue > 0 ? `+${maxOverdue}d` : '✓'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => removeMember(m.client.id)} className="text-xs text-red-400 hover:text-red-600">Retirar</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add member modal */}
            {showAddMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="w-80 rounded-xl bg-white p-6 shadow-xl">
                        <h3 className="mb-3 font-semibold">Agregar miembro</h3>
                        <input type="text" placeholder="Buscar cliente..." value={memberSearch}
                            onChange={e => searchClients(e.target.value)}
                            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black" />
                        {results.length > 0 && (
                            <div className="mt-1 rounded border bg-white shadow">
                                {results.map(c => (
                                    <button key={c.id} onClick={() => addMember(c.id)}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50">
                                        <div>{c.first_name} {c.last_name}</div>
                                        <div className="text-xs text-gray-400">{c.client_number} · Score: {c.internal_score}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setShowAddMember(false)} className="mt-3 w-full rounded border py-2 text-sm hover:bg-gray-50">Cancelar</button>
                    </div>
                </div>
            )}
        </>
    );
}

GroupShow.layout = { breadcrumbs };
