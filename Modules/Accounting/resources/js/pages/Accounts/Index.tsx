import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Edit, Layers, Plus, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

interface AccountRow {
    id: number;
    code: string;
    name: string;
    type: AccountType;
    normal_balance: string;
    is_leaf: boolean;
    active: boolean;
    children_count: number;
    parent: { id: number; code: string; name: string } | null;
    tax: { id: number; name: string } | null;
}

interface PaginatedAccounts {
    data: AccountRow[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; from: number | null; to: number | null; total: number; per_page: number };
}

interface Props {
    accounts: PaginatedAccounts;
    filters: { search?: string; type?: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TYPE_MAP: Record<AccountType, { label: string; className: string }> = {
    asset:     { label: 'Activo',     className: 'border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
    liability: { label: 'Pasivo',     className: 'border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
    equity:    { label: 'Patrimonio', className: 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    income:    { label: 'Ingreso',    className: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
    expense:   { label: 'Gasto',      className: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

export default function AccountsIndex({ accounts, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const flash = props.flash;

    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType]     = useState(filters.type ?? '__all__');

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => navigate(), 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function navigate(t = type, q = search) {
        const p: Record<string, string> = {};
        if (t && t !== '__all__') p.type   = t;
        if (q) p.search = q;
        router.get('/accounting/accounts', p, { preserveState: true, replace: true });
    }

    const { data } = accounts;
    const meta = accounts.meta ?? { current_page: 1, last_page: 1, from: null, to: null, total: data.length, per_page: 50 };

    return (
        <>
            <Head title="Catálogo de Cuentas" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>
                )}

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="relative min-w-[200px]">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input placeholder="Buscar código o nombre…" className="h-9 pl-9 pr-8 text-sm" value={search}
                                        onChange={(e) => setSearch(e.target.value)} />
                                    {search && (
                                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => { setSearch(''); navigate(type, ''); }}>
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                                <Select value={type} onValueChange={(v) => { setType(v); navigate(v); }}>
                                    <SelectTrigger className="h-9 w-36 text-sm">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Todos</SelectItem>
                                        <SelectItem value="asset">Activo</SelectItem>
                                        <SelectItem value="liability">Pasivo</SelectItem>
                                        <SelectItem value="equity">Patrimonio</SelectItem>
                                        <SelectItem value="income">Ingreso</SelectItem>
                                        <SelectItem value="expense">Gasto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Link href="/accounting/accounts/create">
                                <Button size="sm" variant="outline" className="h-9 gap-1.5 bg-white text-black border-zinc-200 hover:bg-zinc-100 dark:bg-white dark:text-black">
                                    <Plus className="h-4 w-4" /> Nueva Cuenta
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <Layers className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No hay cuentas con estos filtros.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                                <th className="pb-2 pr-3 font-semibold">Código</th>
                                                <th className="pb-2 pr-3 font-semibold">Nombre</th>
                                                <th className="pb-2 pr-3 font-semibold">Tipo</th>
                                                <th className="pb-2 pr-3 font-semibold">Saldo normal</th>
                                                <th className="pb-2 pr-3 font-semibold">Cuenta padre</th>
                                                <th className="pb-2 pr-3 font-semibold">Impuesto</th>
                                                <th className="pb-2 font-semibold">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((a) => {
                                                const typeInfo = TYPE_MAP[a.type];
                                                return (
                                                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                                                        <td className="py-2.5 pr-3 font-mono text-xs font-semibold">{a.code}</td>
                                                        <td className="py-2.5 pr-3">
                                                            <span className="text-[13px]">{a.name}</span>
                                                            {!a.is_leaf && <span className="ml-2 text-[10px] text-muted-foreground">(agrupadora)</span>}
                                                        </td>
                                                        <td className="py-2.5 pr-3">
                                                            <Badge className={`text-[10px] border ${typeInfo.className}`}>{typeInfo.label}</Badge>
                                                        </td>
                                                        <td className="py-2.5 pr-3 text-xs text-muted-foreground capitalize">{a.normal_balance}</td>
                                                        <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                                                            {a.parent ? <span className="font-mono">{a.parent.code}</span> : '—'}
                                                        </td>
                                                        <td className="py-2.5 pr-3 text-xs text-muted-foreground">{a.tax?.name ?? '—'}</td>
                                                        <td className="py-2.5">
                                                            <Link href={`/accounting/accounts/${a.id}/edit`}>
                                                                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                                                                    <Edit className="h-3.5 w-3.5" /> Editar
                                                                </Button>
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                {meta.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
                                        <span className="text-[11px] text-muted-foreground">Mostrando {meta.from}–{meta.to} de {meta.total}</span>
                                        <div className="flex gap-1">
                                            {accounts.links.map((link, i) => {
                                                if (link.label === '&laquo; Previous') return <Button key={i} variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!link.url} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}><ChevronLeft className="h-4 w-4" /></Button>;
                                                if (link.label === 'Next &raquo;') return <Button key={i} variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!link.url} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}><ChevronRight className="h-4 w-4" /></Button>;
                                                return <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm" className="h-8 min-w-[32px] px-2 text-xs" disabled={!link.url || link.active} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })} dangerouslySetInnerHTML={{ __html: link.label }} />;
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

AccountsIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Catálogo de Cuentas', href: '/accounting/accounts' },
    ],
};
