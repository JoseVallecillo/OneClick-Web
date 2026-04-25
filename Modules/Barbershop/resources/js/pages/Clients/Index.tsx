import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye, Plus, Search, Trash2, Users, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ClientRow {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    total_visits: number;
    total_spent: number;
    last_visit_at: string | null;
    active: boolean;
    preferred_barber: { id: number; name: string } | null;
}

interface PaginatedClients {
    data: ClientRow[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page?: number; last_page?: number; from?: number | null; to?: number | null; total?: number;
    meta?: { current_page: number; last_page: number; from: number | null; to: number | null; total: number };
}

interface Props {
    clients: PaginatedClients;
    filters: { search?: string; active?: string };
}

function fmtCurrency(n: number) {
    return new Intl.NumberFormat('es-HN', { style: 'currency', currency: 'HNL', minimumFractionDigits: 2 }).format(n);
}

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ClientsIndex({ clients, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [search, setSearch]         = useState(filters.search ?? '');
    const [activeFilter, setActiveFilter] = useState(filters.active ?? '');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => navigate(search, activeFilter), 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function navigate(s: string, a: string) {
        const p: Record<string, string> = {};
        if (s) p.search = s;
        if (a) p.active = a;
        router.get('/barbershop/clients', p, { preserveState: true, replace: true });
    }

    function del(client: ClientRow) {
        if (!confirm(`¿Eliminar al cliente "${client.name}"? Esta acción no se puede deshacer.`)) return;
        setDeletingId(client.id);
        router.delete(`/barbershop/clients/${client.id}`, { onFinish: () => setDeletingId(null) });
    }

    const { data } = clients;
    const meta = clients.meta ?? { current_page: clients.current_page ?? 1, last_page: clients.last_page ?? 1, from: clients.from ?? null, to: clients.to ?? null, total: clients.total ?? data.length };

    return (
        <>
            <Head title="Clientes" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">{flash.success}</div>}
                {flash?.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{flash.error}</div>}

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                <Input placeholder="Buscar por nombre, teléfono o email…" className="h-9 pl-9 pr-8 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
                                {search && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')}><X className="h-3.5 w-3.5" /></button>}
                            </div>
                            <Select value={activeFilter || '__all__'} onValueChange={v => { const a = v === '__all__' ? '' : v; setActiveFilter(a); navigate(search, a); }}>
                                <SelectTrigger className="h-9 w-36 text-sm"><SelectValue placeholder="Estado" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__all__">Todos</SelectItem>
                                    <SelectItem value="1">Activos</SelectItem>
                                    <SelectItem value="0">Inactivos</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="ml-auto flex items-center gap-3">
                                {meta.total > 0 && <span className="hidden text-xs text-muted-foreground sm:inline">{meta.total} clientes</span>}
                                <Link href="/barbershop/clients/create">
                                    <Button size="sm" className="h-9 gap-1.5"><Plus className="h-4 w-4" />Nuevo Cliente</Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <Users className="h-8 w-8 opacity-30" />
                                <p className="text-sm">No se encontraron clientes.</p>
                                <Link href="/barbershop/clients/create"><Button variant="outline" size="sm">Nuevo cliente</Button></Link>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="pb-2 pr-3 font-medium">Nombre</th>
                                                <th className="pb-2 pr-3 font-medium">Teléfono</th>
                                                <th className="pb-2 pr-3 font-medium">Barbero preferido</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Visitas</th>
                                                <th className="pb-2 pr-3 font-medium text-right">Total gastado</th>
                                                <th className="pb-2 pr-3 font-medium">Última visita</th>
                                                <th className="pb-2 pr-3 font-medium">Estado</th>
                                                <th className="pb-2 pr-3 font-medium">Ver</th>
                                                <th className="pb-2 font-medium">Eliminar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map(cl => (
                                                <tr key={cl.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="py-2 pr-3">
                                                        <Link href={`/barbershop/clients/${cl.id}`} className="font-medium hover:text-primary hover:underline">{cl.name}</Link>
                                                        {cl.email && <p className="text-xs text-muted-foreground">{cl.email}</p>}
                                                    </td>
                                                    <td className="py-2 pr-3 text-xs">{cl.phone ?? '—'}</td>
                                                    <td className="py-2 pr-3 text-xs">{cl.preferred_barber?.name ?? '—'}</td>
                                                    <td className="py-2 pr-3 text-right text-xs tabular-nums">{cl.total_visits}</td>
                                                    <td className="py-2 pr-3 text-right text-xs font-semibold tabular-nums text-green-600">{fmtCurrency(cl.total_spent)}</td>
                                                    <td className="py-2 pr-3 text-xs">{fmtDate(cl.last_visit_at)}</td>
                                                    <td className="py-2 pr-3">
                                                        <Badge variant={cl.active ? 'secondary' : 'outline'} className="text-[10px]">{cl.active ? 'Activo' : 'Inactivo'}</Badge>
                                                    </td>
                                                    <td className="py-2 pr-3">
                                                        <Link href={`/barbershop/clients/${cl.id}`}><Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Eye className="h-3.5 w-3.5" /></Button></Link>
                                                    </td>
                                                    <td className="py-2">
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" disabled={deletingId === cl.id} onClick={() => del(cl)}>
                                                            {deletingId === cl.id ? <Spinner className="h-3 w-3" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {(meta.last_page ?? 1) > 1 && (
                                    <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
                                        <span className="text-xs text-muted-foreground">{meta.from}–{meta.to} de {meta.total}</span>
                                        <div className="flex items-center gap-1">
                                            {clients.links.map((link, i) => {
                                                if (link.label === '&laquo; Previous') return <Button key={i} variant="outline" size="sm" className="h-7 w-7 p-0" disabled={!link.url} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}><ChevronLeft className="h-3.5 w-3.5" /></Button>;
                                                if (link.label === 'Next &raquo;') return <Button key={i} variant="outline" size="sm" className="h-7 w-7 p-0" disabled={!link.url} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}><ChevronRight className="h-3.5 w-3.5" /></Button>;
                                                return <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm" className="h-7 min-w-[28px] px-2 text-xs" disabled={!link.url || link.active} onClick={() => link.url && router.get(link.url, {}, { preserveState: true })} dangerouslySetInnerHTML={{ __html: link.label }} />;
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

ClientsIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Barbería', href: '/barbershop' },
        { title: 'Clientes', href: '/barbershop/clients' },
    ],
};
