import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { BedDouble, CheckCircle2, Clock, Plus, User, Wrench } from 'lucide-react';
import { useState } from 'react';

type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';

interface RoomData {
    id: number;
    room_number: string;
    floor: number;
    status: RoomStatus;
    type_name: string;
    base_price: string;
    guest_name: string | null;
    reservation_id: number | null;
}

interface Stats {
    available: number;
    occupied: number;
    cleaning: number;
    maintenance: number;
}

interface Props {
    rooms: RoomData[];
    stats: Stats;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Hospitality', href: '/hospitality/rooms' },
];

const STATUS_CONFIG: Record<RoomStatus, { label: string; icon: typeof CheckCircle2; card: string; badge: string; iconColor: string }> = {
    available:   { label: 'Disponible',  icon: CheckCircle2, card: 'border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/5',   badge: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400', iconColor: 'text-emerald-600 dark:text-emerald-400' },
    occupied:    { label: 'Ocupado',     icon: User,         card: 'border-cyan-500/30 bg-cyan-500/10 dark:bg-cyan-500/5',         badge: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',       iconColor: 'text-cyan-600 dark:text-cyan-400'    },
    cleaning:    { label: 'Limpieza',    icon: Clock,        card: 'border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5',       badge: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',     iconColor: 'text-amber-600 dark:text-amber-400'   },
    maintenance: { label: 'Mantenimiento', icon: Wrench,     card: 'border-red-500/30 bg-red-500/10 dark:bg-red-500/5',           badge: 'bg-red-500/20 text-red-600 dark:text-red-400',         iconColor: 'text-red-600 dark:text-red-400'     },
};

function RoomCard({ room }: { room: RoomData }) {
    const cfg = STATUS_CONFIG[room.status];
    const Icon = cfg.icon;

    return (
        <div className={`flex flex-col rounded-xl border p-4 transition-all hover:ring-1 hover:ring-cyan-500/40 ${cfg.card}`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xl font-bold text-foreground">{room.room_number}</span>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badge}`}>
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                </span>
            </div>

            <p className="text-xs text-muted-foreground">{room.type_name}</p>
            <p className="text-xs text-muted-foreground/80">Piso {room.floor} · <span className="text-muted-foreground font-medium">L.{room.base_price}/noche</span></p>

            {room.guest_name && (
                <div className="mt-2 flex items-center gap-1.5 rounded-md bg-cyan-500/10 px-2 py-1">
                    <User className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="text-sm text-cyan-700 dark:text-cyan-300 font-medium truncate">{room.guest_name}</span>
                </div>
            )}

            <div className="mt-auto pt-3">
                {room.status === 'available' && (
                    <Link href={`/hospitality/reservations/create?room_id=${room.id}`}>
                        <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8">
                            Ingresar
                        </Button>
                    </Link>
                )}
                {room.status === 'occupied' && room.reservation_id && (
                    <Link href={`/hospitality/reservations/${room.reservation_id}`}>
                        <Button size="sm" variant="outline" className="w-full border-primary/40 text-primary hover:bg-primary/10 text-xs h-8">
                            Ver Folio
                        </Button>
                    </Link>
                )}
                {room.status === 'cleaning' && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs h-8"
                        onClick={() => router.patch(`/hospitality/rooms/${room.id}/available`)}
                    >
                        Marcar Disponible
                    </Button>
                )}
            </div>
        </div>
    );
}

export default function RoomBoard({ rooms, stats }: Props) {
    const [floorFilter, setFloorFilter]   = useState<number | null>(null);
    const [statusFilter, setStatusFilter] = useState<RoomStatus | null>(null);

    const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);

    const filtered = rooms.filter((r) => {
        if (floorFilter !== null && r.floor !== floorFilter) return false;
        if (statusFilter !== null && r.status !== statusFilter) return false;
        return true;
    });

    return (
        <>
            <Head title="Room Board" />
        <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Stats row */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {(Object.entries(stats) as [RoomStatus, number][]).map(([key, count]) => {
                        const cfg  = STATUS_CONFIG[key];
                        const Icon = cfg.icon;
                        const active = statusFilter === key;
                        return (
                            <button
                                key={key}
                                onClick={() => setStatusFilter(active ? null : key)}
                                className={`rounded-xl border p-3 text-left transition-all ${active ? cfg.card + ' ring-1 ring-primary/20' : 'border-border bg-card hover:bg-accent'}`}
                            >
                                <Icon className={`h-4 w-4 mb-1 ${cfg.iconColor}`} />
                                <p className="text-2xl font-bold text-foreground">{count}</p>
                                <p className="text-xs text-muted-foreground">{cfg.label}</p>
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-tight font-semibold">Piso:</span>
                        <button
                            onClick={() => setFloorFilter(null)}
                            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${floorFilter === null ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                        >
                            Todos
                        </button>
                        {floors.map((floor) => (
                            <button
                                key={floor}
                                onClick={() => setFloorFilter(floorFilter === floor ? null : floor)}
                                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${floorFilter === floor ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                            >
                                {floor}F
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Link href="/hospitality/reservations">
                            <Button size="sm" variant="outline" className="text-xs h-8 font-semibold">
                                Reservaciones
                            </Button>
                        </Link>
                        <Link href="/hospitality/reservations/create">
                            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-8 shadow-sm shadow-primary/20">
                                <Plus className="mr-1.5 h-4 w-4" />
                                Nueva Reservación
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {filtered.map((room) => (
                        <RoomCard key={room.id} room={room} />
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-full py-16 text-center text-muted-foreground text-sm">
                            <BedDouble className="mx-auto mb-2 h-8 w-8 opacity-20" />
                            No hay habitaciones que coincidan con los filtros.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

RoomBoard.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
