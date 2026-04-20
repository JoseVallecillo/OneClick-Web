import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type VehicleStatus = 'recepcion' | 'preparacion' | 'exhibicion' | 'apartado' | 'vendido';

interface VehicleRow {
    id: number;
    vin: string | null;
    placa: string | null;
    marca: string;
    modelo: string;
    anio: number;
    color: string | null;
    kilometraje: number;
    precio_compra: string;
    costo_total: string;
    estado: VehicleStatus;
    estado_aduana: string;
    received_at: string;
    vendedor: { id: number; name: string } | null;
}

interface PaginatedVehicles {
    data: VehicleRow[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
}

interface Props {
    vehicles: PaginatedVehicles;
    filters: { search?: string; estado?: string };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<VehicleStatus, { label: string; cls: string }> = {
    recepcion:   { label: 'Recepción',   cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    preparacion: { label: 'Preparación', cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    exhibicion:  { label: 'Exhibición',  cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    apartado:    { label: 'Apartado',    cls: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
    vendido:     { label: 'Vendido',     cls: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
};

const STATUS_TABS = [
    { value: '',            label: 'Todos' },
    { value: 'recepcion',   label: 'Recepción' },
    { value: 'preparacion', label: 'Preparación' },
    { value: 'exhibicion',  label: 'Exhibición' },
    { value: 'apartado',    label: 'Apartado' },
    { value: 'vendido',     label: 'Vendidos' },
];

function fmtNum(n: string | number) {
    return Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function VehiclesIndex({ vehicles, filters }: Props) {
    const { props } = usePage<any>();
    const flash = props.flash as { success?: string; error?: string } | undefined;

    const [search, setSearch] = useState(filters.search ?? '');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            router.get(
                '/autolote/vehicles',
                { ...filters, search: search || undefined },
                { preserveState: true, replace: true },
            );
        }, 350);
    }, [search]);

    function setEstado(estado: string) {
        router.get(
            '/autolote/vehicles',
            { search: filters.search || undefined, estado: estado || undefined },
            { preserveState: true, replace: true },
        );
    }

    const currentEstado = filters.estado ?? '';

    return (
        <>
            <Head title="Autolote — Inventario" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">

                {/* Flash */}
                {flash?.success && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-xl font-semibold">Inventario de Vehículos</h1>
                    <Link href="/autolote/vehicles/create">
                        <Button size="sm" className="flex items-center gap-1.5">
                            <Plus className="h-4 w-4" />
                            Registrar Vehículo
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por VIN, placa, marca, modelo..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-9"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Status tabs */}
                <div className="flex gap-0 border-b overflow-x-auto">
                    {STATUS_TABS.map(tab => (
                        <button
                            key={tab.value}
                            onClick={() => setEstado(tab.value)}
                            className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                currentEstado === tab.value
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border bg-card">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/30">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vehículo</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">VIN / Placa</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Km</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Costo Total</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Recepción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                        No hay vehículos registrados.
                                    </td>
                                </tr>
                            ) : (
                                vehicles.data.map(v => {
                                    const status = STATUS_MAP[v.estado];
                                    return (
                                        <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/autolote/vehicles/${v.id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    {v.marca} {v.modelo} {v.anio}
                                                </Link>
                                                {v.color && (
                                                    <span className="ml-1.5 text-xs text-muted-foreground">— {v.color}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">
                                                {v.placa && <div className="font-semibold">{v.placa}</div>}
                                                {v.vin && <div className="text-muted-foreground">{v.vin}</div>}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {v.kilometraje.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums font-medium">
                                                {fmtNum(v.costo_total)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {v.received_at}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {vehicles.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                            Mostrando {vehicles.from}–{vehicles.to} de {vehicles.total}
                        </span>
                        <div className="flex gap-1">
                            {vehicles.links.map((link, i) => (
                                <button
                                    key={i}
                                    disabled={!link.url}
                                    onClick={() => link.url && router.visit(link.url)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`rounded px-2.5 py-1 text-xs ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-muted disabled:opacity-40'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

VehiclesIndex.layout = (page: React.ReactNode) => ({
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Autolote', href: '/autolote/vehicles' },
        { title: 'Inventario', href: '#' },
    ],
    children: page,
});
