import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Edit, Layers, Plus, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type AnalyticalAccountRow = {
    id: number;
    code: string;
    name: string;
    is_leaf: boolean;
    active: boolean;
    children_count: number;
    account: { id: number; code: string; name: string } | null;
    parent: { id: number; code: string; name: string } | null;
};

interface PaginatedAnalyticalAccounts {
    data: AnalyticalAccountRow[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; from: number | null; to: number | null; total: number; per_page: number };
}

interface AccountOption {
    id: number;
    code: string;
    name: string;
}

interface Props {
    analyticalAccounts: PaginatedAnalyticalAccounts;
    accounts: AccountOption[];
    filters: { search?: string; account?: string };
}

export default function AnalyticalAccountsIndex({ analyticalAccounts, accounts, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const flash = props.flash;

    const [search, setSearch] = useState(filters.search ?? '');
    const [account, setAccount] = useState(filters.account ?? '__all__');

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => navigate(), 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function navigate(a = account, q = search) {
        const p: Record<string, string> = {};
        if (a && a !== '__all__') p.account = a;
        if (q) p.search = q;
        router.get('/accounting/analytical-accounts', p, { preserveState: true, replace: true });
    }

    const { data } = analyticalAccounts;
    const meta = analyticalAccounts.meta ?? { current_page: 1, last_page: 1, from: null, to: null, total: data.length, per_page: 50 };

    return (
        <>
            <Head title="Cuentas Analíticas" />
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
                                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => { setSearch(''); navigate(account, ''); }}>
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                                <Select value={account} onValueChange={(v) => { setAccount(v); navigate(v); }}>
                                    <SelectTrigger className="h-9 w-48 text-sm">
                                        <SelectValue placeholder="Cuenta contable" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Todas las cuentas</SelectItem>
                                        {accounts.map((a) => (
                                            <SelectItem key={a.id} value={String(a.id)} className="text-xs">
                                                <span className="font-mono mr-2 text-muted-foreground">{a.code}</span>{a.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Link href="/accounting/analytical-accounts/create">
                                <Button size="sm" variant="outline" className="h-9 gap-1.5 bg-white text-black border-zinc-200 hover:bg-zinc-100 dark:bg-white dark:text-black">
                                    <Plus className="h-4 w-4" /> Nueva Cuenta Analítica
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <Layers className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No hay cuentas analíticas con estos filtros.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                                <th className="pb-2 pr-3 font-semibold">Código</th>
                                                <th className="pb-2 pr-3 font-semibold">Nombre</th>
                                                <th className="pb-2 pr-3 font-semibold">Cuenta Contable</th>
                                                <th className="pb-2 pr-3 font-semibold">Cuenta Padre</th>
                                                <th className="pb-2 font-semibold">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((aa) => (
                                                <tr key={aa.id} className="border-b last:border-0 hover:bg-muted/30">
                                                    <td className="py-2.5 pr-3 font-mono text-xs font-semibold">{aa.code}</td>
                                                    <td className="py-2.5 pr-3">
                                                        <span className="text-[13px]">{aa.name}</span>
                                                        {!aa.is_leaf && <span className="ml-2 text-[10px] text-muted-foreground">(agrupadora)</span>}
                                                    </td>
                                                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                                                        {aa.account ? (
                                                            <span><span className="font-mono">{aa.account.code}</span> {aa.account.name}</span>
                                                        ) : '—'}
                                                    </td>
                                                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                                                        {aa.parent ? <span className="font-mono">{aa.parent.code}</span> : '—'}
                                                    </td>
                                                    <td className="py-2.5">
                                                        <Link href={`/accounting/analytical-accounts/${aa.id}/edit`}>
                                                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                                                                <Edit className="h-3.5 w-3.5" /> Editar
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
                                        <span className="text-[11px] text-muted-foreground">Mostrando {meta.from}–{meta.to} de {meta.total}</span>
                                        <div className="flex gap-1">
                                            {analyticalAccounts.links.map((link, i) => {
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

AnalyticalAccountsIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Cuentas Analíticas', href: '/accounting/analytical-accounts' },
    ],
};
