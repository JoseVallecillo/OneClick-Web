// ACTUALIZADO: Filtros en lista desplegable
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BookUser, ChevronLeft, ChevronRight, ListFilter, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ContactRow {
    id: number;
    name: string;
    legal_name: string | null;
    rtn: string | null;
    dni: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    is_client: boolean;
    is_supplier: boolean;
    is_employee: boolean;
    active: boolean;
    addresses_count: number;
    persons_count: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedContacts {
    data: ContactRow[];
    links: PaginationLink[];
    meta?: {
        current_page: number;
        from: number | null;
        last_page: number;
        per_page: number;
        to: number | null;
        total: number;
    };
    current_page?: number;
    from?: number | null;
    last_page?: number;
    per_page?: number;
    to?: number | null;
    total?: number;
}

interface Props {
    contacts: PaginatedContacts;
    filters: { search?: string; type?: string; active?: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
    { value: '',         label: 'Todos'       },
    { value: 'client',   label: 'Clientes'    },
    { value: 'supplier', label: 'Proveedores' },
    { value: 'employee', label: 'Empleados'   },
];

function TypeBadges({ row }: { row: ContactRow }) {
    return (
        <div className="flex flex-wrap gap-1">
            {row.is_client   && <Badge variant="default"   className="text-[10px]">Cliente</Badge>}
            {row.is_supplier && <Badge variant="secondary" className="text-[10px]">Proveedor</Badge>}
            {row.is_employee && <Badge variant="outline"   className="text-[10px]">Empleado</Badge>}
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ContactsIndex({ contacts, filters }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [search, setSearch]         = useState(filters.search ?? '');
    const [type, setType]             = useState(filters.type ?? '');
    const [activeFilter, setActiveFilter] = useState(filters.active ?? '');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced search → update URL
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            navigate(search, type, activeFilter);
        }, 350);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function navigate(s: string, t: string, a: string) {
        const p: Record<string, string> = {};
        if (s) p.search = s;
        if (t) p.type   = t;
        if (a) p.active = a;
        router.get('/contacts', p, { preserveState: true, replace: true });
    }

    function changeType(t: string) {
        setType(t);
        navigate(search, t, activeFilter);
    }

    function changeActive(a: string) {
        setActiveFilter(a);
        navigate(search, type, a);
    }

    function deleteContact(c: ContactRow) {
        if (!confirm(`¿Eliminar el contacto "${c.name}"? Esta acción no se puede deshacer.`)) return;
        setDeletingId(c.id);
        router.delete(`/contacts/${c.id}`, { onFinish: () => setDeletingId(null) });
    }

    const { data } = contacts;
    const meta = contacts.meta ?? {
        current_page: contacts.current_page ?? 1,
        from: contacts.from ?? null,
        last_page: contacts.last_page ?? 1,
        per_page: contacts.per_page ?? 50,
        to: contacts.to ?? null,
        total: contacts.total ?? data.length,
    };

    return (
        <>
            <Head title="Contactos" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Flash */}
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
                            <div className="flex w-full max-w-md items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar contactos…"
                                        className="h-9 pl-9 pr-8 text-sm"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    {search && (
                                        <button
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => setSearch('')}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-9 gap-1.5 focus-visible:ring-0">
                                            <ListFilter className="h-4 w-4" />
                                            <span>Filtros</span>
                                            {(type !== '' || activeFilter !== '') && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-0.5 h-4.5 rounded-full px-1.5 text-[10px] font-medium"
                                                >
                                                    {(type !== '' ? 1 : 0) + (activeFilter !== '' ? 1 : 0)}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Tipo de Contacto
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={type} onValueChange={changeType}>
                                            {TYPE_OPTIONS.map((opt) => (
                                                <DropdownMenuRadioItem key={opt.value} value={opt.value} className="text-sm">
                                                    {opt.label}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Estado
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={activeFilter} onValueChange={changeActive}>
                                            <DropdownMenuRadioItem value="" className="text-sm">Todos</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="1" className="text-sm">Activos</DropdownMenuRadioItem>
                                            <DropdownMenuRadioItem value="0" className="text-sm">Inactivos</DropdownMenuRadioItem>
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="flex items-center gap-3 ml-auto">
                                {meta.total > 0 && (
                                    <span className="hidden text-xs text-muted-foreground sm:inline-block">
                                        {meta.total} {meta.total === 1 ? 'contacto' : 'contactos'}
                                    </span>
                                )}
                                <Link href="/contacts/create">
                                    <Button size="sm" className="flex items-center gap-1.5 h-9">
                                        <Plus className="h-4 w-4" />
                                        Nuevo contacto
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <BookUser className="h-8 w-8 opacity-40" />
                                <p className="text-sm">
                                    {search || type || activeFilter
                                        ? 'No se encontraron contactos con esos filtros.'
                                        : 'Aún no hay contactos. Crea el primero.'}
                                </p>
                                {!search && !type && !activeFilter && (
                                    <Link href="/contacts/create">
                                        <Button variant="outline" size="sm">Crear contacto</Button>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="pb-2 pr-4 font-medium">Nombre</th>
                                                <th className="pb-2 pr-4 font-medium">RTN / DNI</th>
                                                <th className="pb-2 pr-4 font-medium">Correo</th>
                                                <th className="pb-2 pr-4 font-medium">Teléfono</th>
                                                <th className="pb-2 pr-4 font-medium">Tipo</th>
                                                <th className="pb-2 pr-4 font-medium">Estado</th>
                                                <th className="pb-2 pr-4 font-medium">Info</th>
                                                <th className="pb-2 pr-4 font-medium">Editar</th>
                                                <th className="pb-2 font-medium">Eliminar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((c) => (
                                                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="py-2 pr-4">
                                                        <Link
                                                            href={`/contacts/${c.id}/edit`}
                                                            className="font-medium hover:text-primary hover:underline"
                                                        >
                                                            {c.name}
                                                        </Link>
                                                        {c.legal_name && (
                                                            <p className="text-[11px] text-muted-foreground">{c.legal_name}</p>
                                                        )}
                                                    </td>
                                                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">
                                                        {c.rtn
                                                            ? <div>RTN: {c.rtn}</div>
                                                            : c.dni
                                                                ? <div>DNI: {c.dni}</div>
                                                                : '—'
                                                        }
                                                    </td>
                                                    <td className="py-2 pr-4 text-xs text-muted-foreground">
                                                        {c.email ?? '—'}
                                                    </td>
                                                    <td className="py-2 pr-4 text-xs text-muted-foreground">
                                                        {c.phone ?? c.mobile ?? '—'}
                                                    </td>
                                                    <td className="py-2 pr-4">
                                                        <TypeBadges row={c} />
                                                    </td>
                                                    <td className="py-2 pr-4">
                                                        <Badge variant={c.active ? 'secondary' : 'destructive'}>
                                                            {c.active ? 'Activo' : 'Inactivo'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2 pr-4">
                                                        <div className="flex gap-2 text-[11px] text-muted-foreground">
                                                            {c.addresses_count > 0 && (
                                                                <span>{c.addresses_count} dir.</span>
                                                            )}
                                                            {c.persons_count > 0 && (
                                                                <span>{c.persons_count} pers.</span>
                                                            )}
                                                            {c.addresses_count === 0 && c.persons_count === 0 && '—'}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 pr-4">
                                                        <Link href={`/contacts/${c.id}/edit`}>
                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                <Pencil className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                    <td className="py-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                            disabled={deletingId === c.id}
                                                            onClick={() => deleteContact(c)}
                                                        >
                                                            {deletingId === c.id
                                                                ? <Spinner className="h-3 w-3" />
                                                                : <Trash2 className="h-3.5 w-3.5" />
                                                            }
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Paginación */}
                                {meta.last_page > 1 && (
                                    <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
                                        <span className="text-xs text-muted-foreground">
                                            {meta.from}–{meta.to} de {meta.total}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {contacts.links.map((link, i) => {
                                                if (link.label === '&laquo; Previous') {
                                                    return (
                                                        <Button
                                                            key={i}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            disabled={!link.url}
                                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                        >
                                                            <ChevronLeft className="h-3.5 w-3.5" />
                                                        </Button>
                                                    );
                                                }
                                                if (link.label === 'Next &raquo;') {
                                                    return (
                                                        <Button
                                                            key={i}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            disabled={!link.url}
                                                            onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                        >
                                                            <ChevronRight className="h-3.5 w-3.5" />
                                                        </Button>
                                                    );
                                                }
                                                return (
                                                    <Button
                                                        key={i}
                                                        variant={link.active ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="h-7 min-w-[28px] px-2 text-xs"
                                                        disabled={!link.url || link.active}
                                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
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

ContactsIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contactos', href: '/contacts' },
    ],
};
