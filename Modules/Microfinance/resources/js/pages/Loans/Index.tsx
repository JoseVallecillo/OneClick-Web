import { type BreadcrumbItem } from '@/types';
import { Head,  router  } from '@inertiajs/react';
import { AlertTriangle, Gavel, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Microfinanzas', href: '/microfinance' },
    { title: 'Cartera', href: '/microfinance/loans' },
];
const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente', committee_review: 'En revisión', approved: 'Aprobado',
    disbursed: 'Desembolsado', current: 'Al día', delinquent: 'En mora',
    judicial: 'Judicial', paid_off: 'Cancelado', written_off: 'Castigo',
};
const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600', committee_review: 'bg-blue-100 text-blue-700',
    approved: 'bg-cyan-100 text-cyan-700', disbursed: 'bg-green-50 text-green-700',
    current: 'bg-green-100 text-green-700', delinquent: 'bg-yellow-100 text-yellow-700',
    judicial: 'bg-red-100 text-red-700', paid_off: 'bg-gray-100 text-gray-400', written_off: 'bg-gray-200 text-gray-500',
};
const PAR_COLORS: Record<string, string> = {
    current: 'bg-green-100 text-green-800', par1: 'bg-yellow-100 text-yellow-800',
    par30: 'bg-orange-100 text-orange-800', par60: 'bg-red-100 text-red-800', par90: 'bg-red-200 text-red-900 font-bold',
};

interface Loan {
    id: number; loan_number: string; cycle_number: number; status: string;
    principal_balance: string; days_overdue: number; par_category: string;
    payment_frequency: string;
    client: { first_name: string; last_name: string; client_number: string };
    product: { name: string };
}
interface Props {
    loans: { data: Loan[]; links: any[] };
    filters: Record<string, string>;
    summary: { total_portfolio: number; delinquent_count: number; par30_amount: number; pending_approval: number };
}

export default function LoansIndex({ loans, filters, summary }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [par, setPar]       = useState(filters.par ?? '');

    const filter = () => router.get('/microfinance/loans', { search, status, par }, { preserveState: true, replace: true });

    return (
        <>
            <Head title="Microfinanzas" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Cartera de Créditos</h1>
                    <div className="flex gap-2">
                        <button onClick={() => router.post('/microfinance/loans/refresh-delinquency')}
                            className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">Actualizar mora</button>
                        <button onClick={() => router.visit('/microfinance/loans/create')}
                            className="rounded bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-900">+ Nueva solicitud</button>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-lg border bg-white p-3">
                        <p className="text-xs text-gray-400">Cartera total</p>
                        <p className="mt-1 text-xl font-bold text-green-600">L.{fmt(summary.total_portfolio)}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-3">
                        <p className="text-xs text-gray-400">En mora</p>
                        <p className="mt-1 text-xl font-bold text-yellow-600">{summary.delinquent_count}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-3">
                        <p className="text-xs text-gray-400">PaR &gt; 30 días</p>
                        <p className="mt-1 text-xl font-bold text-red-600">L.{fmt(summary.par30_amount)}</p>
                    </div>
                    <div className="rounded-lg border bg-white p-3">
                        <p className="text-xs text-gray-400">Pend. aprobación</p>
                        <p className="mt-1 text-xl font-bold text-gray-600">{summary.pending_approval}</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <input type="text" placeholder="N° crédito o cliente..." value={search}
                        onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && filter()}
                        className="w-56 rounded border px-3 py-1.5 text-sm focus:outline-none" />
                    <select value={status} onChange={e => setStatus(e.target.value)} className="rounded border px-3 py-1.5 text-sm">
                        <option value="">Todos los estados</option>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <select value={par} onChange={e => setPar(e.target.value)} className="rounded border px-3 py-1.5 text-sm">
                        <option value="">Todos PaR</option>
                        {['current','par1','par30','par60','par90'].map(p => <option key={p} value={p}>{p === 'current' ? 'Al día' : p.toUpperCase()}</option>)}
                    </select>
                    <button onClick={filter} className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50">Filtrar</button>
                </div>

                <div className="overflow-hidden rounded-lg border bg-white">
                    <table className="w-full text-sm">
                        <thead className="border-b bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">N° Crédito</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Cliente</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Producto</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Ciclo</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-500">Saldo</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Mora</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">PaR</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-500">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loans.data.map(l => (
                                <tr key={l.id} className="cursor-pointer hover:bg-gray-50"
                                    onClick={() => router.visit(`/microfinance/loans/${l.id}`)}>
                                    <td className="px-4 py-3 font-mono text-xs font-medium">{l.loan_number}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{l.client.first_name} {l.client.last_name}</div>
                                        <div className="text-xs text-gray-400">{l.client.client_number}</div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{l.product.name}</td>
                                    <td className="px-4 py-3 text-center text-xs">{l.cycle_number}</td>
                                    <td className="px-4 py-3 text-right font-medium">L.{fmt(l.principal_balance)}</td>
                                    <td className={`px-4 py-3 text-center text-xs font-bold ${l.days_overdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {l.days_overdue > 0 ? `+${l.days_overdue}d` : '✓'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`rounded px-1.5 py-0.5 text-xs ${PAR_COLORS[l.par_category]}`}>
                                            {l.par_category === 'current' ? 'Al día' : l.par_category.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[l.status]}`}>{STATUS_LABELS[l.status]}</span>
                                    </td>
                                </tr>
                            ))}
                            {loans.data.length === 0 && <tr><td colSpan={8} className="py-10 text-center text-gray-400">Sin créditos</td></tr>}
                        </tbody>
                    </table>
                </div>

                {loans.links && (
                    <div className="flex justify-center gap-1">
                        {loans.links.map((l: any, i: number) => (
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

LoansIndex.layout = { breadcrumbs };
