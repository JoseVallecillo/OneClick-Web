import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BookOpen, ChevronLeft, ChevronRight, Eye, Plus, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type MoveState = 'draft' | 'posted' | 'cancelled';

interface MoveRow {
    id: number;
    reference: string;
    date: string;
    narration: string | null;
    state: MoveState;
    journal: { id: number; name: string; code: string };
    creator: { id: number; name: string };
    lines_count: number;
    created_at: string;
}

interface JournalFilter {
    id: number;
    name: string;
    code: string;
}

interface PaginatedMoves {
    data: MoveRow[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: {
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        total: number;
        per_page: number;
    };
}

interface Props {
    moves: PaginatedMoves;
    journals: JournalFilter[];
    filters: { search?: string; state?: string; journal_id?: string; date_from?: string; date_to?: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATE_MAP: Record<MoveState, { label: string; className: string }> = {
    draft:     { label: 'Borrador',   className: 'border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400' },
    posted:    { label: 'Publicado',  className: 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    cancelled: { label: 'Anulado',    className: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

function StateBadge({ state }: { state: MoveState }) {
    const info = STATE_MAP[state] ?? { label: state, className: '' };
    return <Badge className={`text-[10px] border ${info.className}`}>{info.label}</Badge>;
}

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MovesIndex({ moves, journals, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [search, setSearch]       = useState(filters.search ?? '');
    const [state, setState]         = useState(filters.state ?? '__all__');
    const [journalId, setJournalId] = useState(filters.journal_id ?? '__all__');
    const [dateFrom, setDateFrom]   = useState(filters.date_from ?? '');
    const [dateTo, setDateTo]       = useState(filters.date_to ?? '');

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => navigate(), 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function navigate(
        s = state,
        j = journalId,
        df = dateFrom,
        dt = dateTo,
        q = search,
    ) {
        const p: Record<string, string> = {};
        if (s && s !== '__all__') p.state      = s;
        if (j && j !== '__all__') p.journal_id = j;
        if (df) p.date_from = df;
        if (dt) p.date_to   = dt;
        if (q)  p.search    = q;
        router.get('/accounting/moves', p, { preserveState: true, replace: true });
    }

    const { data } = moves;
    const meta = moves.meta ?? { current_page: 1, last_page: 1, from: null, to: null, total: data.length, per_page: 50 };

    return (
        <>
            <Head title="Libro Diario" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex w-full max-w-3xl flex-wrap items-center gap-2">
                                {/* Search */}
                                <div className="relative flex-1 min-w-[180px]">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar referencia o narración…"
                                        className="h-9 pl-9 pr-8 text-sm"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    {search && (
                                        <button
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => { setSearch(''); navigate(state, journalId, dateFrom, dateTo, ''); }}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* State filter */}
                                <Select value={state} onValueChange={(v) => { setState(v); navigate(v); }}>
                                    <SelectTrigger className="h-9 w-36 text-sm">
                                        <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Todos</SelectItem>
                                        <SelectItem value="draft">Borrador</SelectItem>
                                        <SelectItem value="posted">Publicado</SelectItem>
                                        <SelectItem value="cancelled">Anulado</SelectItem>
                                    </SelectContent>
                                </Select>

                                {/* Journal filter */}
                                <Select value={journalId} onValueChange={(v) => { setJournalId(v); navigate(state, v); }}>
                                    <SelectTrigger className="h-9 w-40 text-sm">
                                        <SelectValue placeholder="Diario" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Todos los diarios</SelectItem>
                                        {journals.map((j) => (
                                            <SelectItem key={j.id} value={String(j.id)}>{j.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Date range */}
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); navigate(state, journalId, e.target.value, dateTo); }}
                                            className="h-9 w-32 text-xs pl-2 pr-2" />
                                        <span className="absolute -top-3 left-1 text-[9px] text-muted-foreground uppercase font-bold bg-background px-1">Desde</span>
                                    </div>
                                    <div className="relative">
                                        <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); navigate(state, journalId, dateFrom, e.target.value); }}
                                            className="h-9 w-32 text-xs pl-2 pr-2" />
                                        <span className="absolute -top-3 left-1 text-[9px] text-muted-foreground uppercase font-bold bg-background px-1">Hasta</span>
                                    </div>
                                </div>
                            </div>

                            <Link href="/accounting/moves/create">
                                <Button size="sm" variant="outline"
                                    className="flex items-center gap-1.5 h-9 bg-white text-black border-zinc-200 shadow-sm hover:bg-zinc-100 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                                    <Plus className="h-4 w-4" />
                                    Nuevo Asiento
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <BookOpen className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No hay asientos en esta selección.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                                <th className="pb-2 pr-3 font-semibold">Referencia</th>
                                                <th className="pb-2 pr-3 font-semibold">Fecha</th>
                                                <th className="pb-2 pr-3 font-semibold">Diario</th>
                                                <th className="pb-2 pr-3 font-semibold">Narración</th>
                                                <th className="pb-2 pr-3 font-semibold text-center">Apuntes</th>
                                                <th className="pb-2 pr-3 font-semibold">Estado</th>
                                                <th className="pb-2 font-semibold">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((m) => (
                                                <tr key={m.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                                                    <td className="py-2.5 pr-3 font-mono text-xs font-semibold text-primary">{m.reference}</td>
                                                    <td className="py-2.5 pr-3 text-xs tabular-nums">{fmtDate(m.date)}</td>
                                                    <td className="py-2.5 pr-3">
                                                        <span className="text-[11px] font-medium">{m.journal.name}</span>
                                                    </td>
                                                    <td className="py-2.5 pr-3 max-w-[220px] truncate text-xs text-muted-foreground">
                                                        {m.narration ?? '—'}
                                                    </td>
                                                    <td className="py-2.5 pr-3 text-center text-xs tabular-nums">{m.lines_count}</td>
                                                    <td className="py-2.5 pr-3"><StateBadge state={m.state} /></td>
                                                    <td className="py-2.5">
                                                        <Link href={`/accounting/moves/${m.id}`}>
                                                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-primary/20 hover:border-primary/50 text-primary">
                                                                <Eye className="h-3.5 w-3.5" />
                                                                Ver
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {meta.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
                                        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">
                                            Mostrando {meta.from}–{meta.to} de {meta.total} registros
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {moves.links.map((link, i) => {
                                                if (link.label === '&laquo; Previous') {
                                                    return (
                                                        <Button key={i} variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!link.url}
                                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                    );
                                                }
                                                if (link.label === 'Next &raquo;') {
                                                    return (
                                                        <Button key={i} variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!link.url}
                                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}>
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    );
                                                }
                                                return (
                                                    <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm"
                                                        className="h-8 min-w-[32px] px-2 text-xs" disabled={!link.url || link.active}
                                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                        dangerouslySetInnerHTML={{ __html: link.label }} />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

MovesIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Libro Diario', href: '/accounting/moves' },
    ],
};
