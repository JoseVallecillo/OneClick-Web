import { Head, Link, router } from '@inertiajs/react';
import {
    BookOpen,
    ChefHat,
    Clock,
    CreditCard,
    LayoutGrid,
    Pencil,
    Plus,
    Receipt,
    RefreshCw,
    Search,
    Settings,
    Users,
    UtensilsCrossed,
    X,
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
    bg:          'var(--background)',
    sidebar:     'var(--sidebar)',
    card:        'var(--card)',
    cardHover:   'var(--accent)',
    border:      'var(--border)',
    borderMid:   'var(--input)',
    teal:        'oklch(0.722 0.149 191.517)', // Vibrant Teal
    tealDim:     'oklch(0.648 0.132 193.125)',
    tealGlow:    'oklch(0.722 0.149 191.517 / 0.28)',
    tealSoft:    'oklch(0.722 0.149 191.517 / 0.08)',
    red:         'oklch(0.707 0.165 25.425)', // Vibrant Red
    redGlow:     'oklch(0.707 0.165 25.425 / 0.18)',
    redSoft:     'oklch(0.707 0.165 25.425 / 0.06)',
    amber:       'oklch(0.769 0.188 70.08)', // Vibrant Amber
    amberGlow:   'oklch(0.769 0.188 70.08 / 0.28)',
    amberSoft:   'oklch(0.769 0.188 70.08 / 0.08)',
    text:        'var(--foreground)',
    muted:       'var(--muted-foreground)',
    faint:       'color-mix(in srgb, var(--muted-foreground), transparent 40%)',
    overlay:     'color-mix(in srgb, var(--background), transparent 15%)',
};

const STATUS_RING = {
    available:   { box: `0 0 0 2px ${C.teal}, 0 0 22px ${C.tealGlow}`,  bg: C.tealSoft  },
    occupied:    { box: `0 0 0 2px ${C.red},  0 0 14px ${C.redGlow}`,   bg: C.redSoft   },
    pending_food:{ box: `0 0 0 2px ${C.amber},0 0 22px ${C.amberGlow}`, bg: C.amberSoft },
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Table {
    id: number;
    number: number;
    section: string;
    shape: 'circle' | 'square';
    capacity: number;
    status: 'available' | 'occupied' | 'pending_food';
    server_name: string | null;
    waiter_name: string | null;
    time_open: string | null;
    total: number;
    current_sale_id: number | null;
    current_order_id: number | null;
}

interface Waiter { id: number; name: string; code: string | null }

function fmtTotal(v: number) {
    return v.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
    tables: Table[];
    sections: string[];
    activeSection: string;
    activeView: string;
    activeSession: { id: number; reference: string } | null;
    waiters: Waiter[];
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ activeView }: { activeView: string }) {
    const NAV_ITEMS = [
        { icon: LayoutGrid,      label: 'Mesas',    href: '/pos/tables',   id: 'all'  },
        { icon: ChefHat,         label: 'Cocina',   href: '/pos/tables?view=kitchen', id: 'kitchen' },
        { icon: Receipt,         label: 'Cuentas',  href: '/pos/tables?view=occupied', id: 'occupied' },
    ];

    return (
        <aside style={{
            width: 72,
            minWidth: 72,
            background: C.sidebar,
            borderRight: `1px solid ${C.border}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 16,
            paddingBottom: 16,
            gap: 4,
        }}>
            {/* Logo */}
            <Link href="/pos/tables" style={{ marginBottom: 20, textDecoration: 'none' }}>
                <div style={{
                    width: 40, height: 40,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${C.teal}, ${C.tealDim})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 16px ${C.tealGlow}`,
                }}>
                    <UtensilsCrossed size={20} color="#fff" />
                </div>
            </Link>

            {/* Nav items */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, width: '100%', padding: '0 8px' }}>
                {NAV_ITEMS.map((item) => (
                    <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
                        <div
                            title={item.label}
                            style={{
                                width: '100%',
                                height: 44,
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: item.id === activeView ? C.tealSoft : 'transparent',
                                color: item.id === activeView ? C.teal : C.faint,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                border: item.id === activeView ? `1px solid rgba(20,184,166,0.25)` : '1px solid transparent',
                            }}
                        >
                            <item.icon size={20} />
                        </div>
                    </Link>
                ))}
            </div>

            {/* POS link */}
            <div style={{ padding: '0 8px', width: '100%' }}>
                <Link href="/pos/sessions" style={{ textDecoration: 'none' }}>
                    <div
                        title="Terminal POS"
                        style={{
                            width: '100%', height: 44, borderRadius: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', color: C.faint,
                            border: '1px solid transparent',
                        }}
                    >
                        <CreditCard size={18} />
                    </div>
                </Link>
            </div>
        </aside>
    );
}

// ── Header ────────────────────────────────────────────────────────────────────
interface HeaderProps {
    stats: { total: number; occupied: number; pending: number; available: number };
    search: string;
    onSearchChange: (v: string) => void;
    activeSection: string;
    sections: string[];
    onSectionChange: (v: string) => void;
    activeSession: Props['activeSession'];
    onRefresh: () => void;
}

function Header({ stats, search, onSearchChange, activeSection, sections, onSectionChange, activeSession, onRefresh }: HeaderProps) {
    return (
        <header style={{
            height: 64,
            background: C.bg,
            borderBottom: `1px solid ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 28px',
            gap: 16,
            flexShrink: 0,
        }}>
            {/* Brand */}
            <div style={{ display: 'flex', flexDirection: 'column', marginRight: 8, minWidth: 160 }}>
                <span style={{ color: C.text, fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    OneClick <span style={{ color: C.teal }}>Restaurant</span>
                </span>
                <span style={{ color: C.faint, fontSize: 11, marginTop: 1 }}>Table Board</span>
            </div>

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: 8, marginRight: 8 }}>
                <StatPill label="Total" value={stats.total} color={C.muted} />
                <StatPill label="Libres" value={stats.available} color={C.teal} />
                <StatPill label="Ocupadas" value={stats.occupied} color={C.red} />
                <StatPill label="En cocina" value={stats.pending} color={C.amber} />
            </div>

            <div style={{ flex: 1 }} />

            {/* Search */}
            <div style={{ position: 'relative', width: 220 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.faint, pointerEvents: 'none' }} />
                <input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar mesa o mesero…"
                    style={{
                        width: '100%',
                        height: 36,
                        background: C.card,
                        border: `1px solid ${C.borderMid}`,
                        borderRadius: 8,
                        paddingLeft: 34,
                        paddingRight: search ? 32 : 12,
                        color: C.text,
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box',
                    }}
                />
                {search && (
                    <button
                        onClick={() => onSearchChange('')}
                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.faint, display: 'flex', padding: 0 }}
                    >
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* Section filter */}
            <select
                value={activeSection}
                onChange={(e) => onSectionChange(e.target.value)}
                style={{
                    height: 36,
                    background: C.card,
                    border: `1px solid ${C.borderMid}`,
                    borderRadius: 8,
                    padding: '0 12px',
                    color: C.text,
                    fontSize: 13,
                    outline: 'none',
                    cursor: 'pointer',
                    minWidth: 140,
                }}
            >
                <option value="all">Todas las Secciones</option>
                {sections.map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>

            {/* Refresh */}
            <button
                onClick={onRefresh}
                title="Actualizar"
                style={{
                    width: 36, height: 36,
                    borderRadius: 8,
                    background: C.card,
                    border: `1px solid ${C.borderMid}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: C.faint,
                }}
            >
                <RefreshCw size={14} />
            </button>

            {/* Admin links */}
            <Link href="/pos/tables/create" style={{ textDecoration: 'none' }}>
                <button title="Agregar mesa" style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: C.card, border: `1px solid ${C.borderMid}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: C.faint,
                }}>
                    <Plus size={14} />
                </button>
            </Link>
            <Link href="/pos/waiters" style={{ textDecoration: 'none' }}>
                <button title="Gestionar meseros" style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: C.card, border: `1px solid ${C.borderMid}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: C.faint,
                }}>
                    <Users size={14} />
                </button>
            </Link>

            {/* New Order */}
            {activeSession ? (
                <Link href={`/pos/sessions/${activeSession.id}/sell`} style={{ textDecoration: 'none' }}>
                    <button style={{
                        height: 36,
                        padding: '0 16px',
                        borderRadius: 8,
                        background: `linear-gradient(135deg, ${C.teal}, ${C.tealDim})`,
                        border: 'none',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: `0 0 16px ${C.tealGlow}`,
                        letterSpacing: '-0.01em',
                    }}>
                        <Plus size={15} />
                        Nueva Orden
                    </button>
                </Link>
            ) : (
                <Link href="/pos/sessions/open" style={{ textDecoration: 'none' }}>
                    <button style={{
                        height: 36, padding: '0 16px', borderRadius: 8,
                        background: C.card, border: `1px solid ${C.teal}`,
                        color: C.teal, fontWeight: 600, fontSize: 13,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <Plus size={15} />
                        Abrir Caja
                    </button>
                </Link>
            )}
        </header>
    );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: C.card, border: `1px solid ${C.borderMid}`,
            borderRadius: 20, padding: '4px 10px',
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ color: C.muted, fontSize: 11 }}>{label}</span>
            <span style={{ color: C.text, fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        </div>
    );
}

// ── Table Card ────────────────────────────────────────────────────────────────
interface TableCardProps {
    table: Table;
    sessionId: number | null;
    waiters: Waiter[];
    onStatusChange: (id: number, status: Table['status']) => void;
}

function TableCard({ table, sessionId, waiters, onStatusChange }: TableCardProps) {
    const [hovered, setHovered] = useState(false);
    const [selectedWaiter, setSelectedWaiter] = useState('');
    const [alertState, setAlertState] = useState<{ open: boolean, type: 'alert' | 'confirm', title: string, desc: string, onConfirm?: () => void }>({ open: false, type: 'alert', title: '', desc: '' });

    const ring = STATUS_RING[table.status];
    const isCircle = table.shape === 'circle';

    const cardBase: React.CSSProperties = {
        background: hovered ? C.cardHover : C.card,
        boxShadow: ring.box,
        transition: 'all 0.2s ease',
        cursor: table.status !== 'available' ? 'pointer' : 'default',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
    };

    if (isCircle) {
        cardBase.borderRadius = '50%';
        cardBase.width  = 168;
        cardBase.height = 168;
        cardBase.flexShrink = 0;
    } else {
        cardBase.borderRadius = 16;
        cardBase.padding = '16px 18px';
        cardBase.minHeight = 160;
    }

    const handleClick = () => {
        if ((table.status === 'occupied' || table.status === 'pending_food') && table.current_order_id) {
            router.visit(`/pos/orders/${table.current_order_id}`);
        }
    };

    const handleOpenTable = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!sessionId) {
            router.visit('/pos/sessions/open');
            return;
        }
        if (waiters.length > 0 && !selectedWaiter) {
            setAlertState({
                open: true,
                type: 'alert',
                title: 'Mesero Requerido',
                desc: 'Debes seleccionar un mesero para poder abrir esta mesa.',
            });
            return;
        }
        router.post(`/pos/tables/${table.id}/open`, {
            waiter_id: selectedWaiter || null,
        });
    };

    const handleGoToOrder = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (table.current_order_id) {
            router.visit(`/pos/orders/${table.current_order_id}`);
        }
    };

    const handleMarkKitchen = (e: React.MouseEvent) => {
        e.stopPropagation();
        onStatusChange(table.id, 'pending_food');
    };

    const handleRelease = (e: React.MouseEvent) => {
        e.stopPropagation();
        setAlertState({
            open: true,
            type: 'confirm',
            title: 'Liberar Mesa',
            desc: '¿Seguro que deseas liberar esta mesa? Si hay una orden activa sin cobrar, será eliminada / cancelada.',
            onConfirm: () => {
                router.post(`/pos/tables/${table.id}/close`, {}, { preserveScroll: true });
            }
        });
    };

    if (isCircle) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div
                    style={cardBase}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    onClick={handleClick}
                >
                    {/* Radial bg accent */}
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: `radial-gradient(circle at 50% 30%, ${ring.bg}, transparent 70%)`,
                        pointerEvents: 'none',
                    }} />

                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        padding: 12, gap: 3,
                    }}>
                        {/* Status dot */}
                        <StatusDot status={table.status} />

                        <span style={{ color: C.muted, fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                            Mesa
                        </span>
                        <span style={{ color: C.text, fontSize: 22, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em' }}>
                            {table.number}
                        </span>

                        {table.status === 'available' && (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                    <Users size={10} color={C.faint} />
                                    <span style={{ color: C.faint, fontSize: 10 }}>{table.capacity}</span>
                                </div>
                                <button
                                    onClick={handleOpenTable}
                                    style={{
                                        marginTop: 6,
                                        padding: '4px 12px',
                                        borderRadius: 20,
                                        background: C.teal,
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: 10,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        letterSpacing: '0.02em',
                                    }}
                                >
                                    Abrir
                                </button>
                            </>
                        )}

                        {table.status === 'occupied' && (
                            <>
                                <span style={{ color: C.red, fontSize: 11, fontWeight: 600 }}>{table.time_open ?? '—'}</span>
                                <span style={{ color: C.text, fontSize: 10, fontWeight: 700 }}>{fmtTotal(table.total)}</span>
                                <span style={{ color: C.muted, fontSize: 9, maxWidth: 100, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {table.server_name ?? '—'}
                                </span>
                            </>
                        )}

                        {table.status === 'pending_food' && (
                            <>
                                <ChefHat size={20} color={C.amber} style={{ marginTop: 2 }} />
                                <span style={{ color: C.amber, fontSize: 10, fontWeight: 600, textAlign: 'center' }}>En cocina</span>
                                <span style={{ color: C.muted, fontSize: 9 }}>{table.time_open ?? '—'}</span>
                            </>
                        )}
                    </div>
                </div>
                
                <AlertDialog open={alertState.open} onOpenChange={(open) => setAlertState(s => ({ ...s, open }))}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{alertState.title}</AlertDialogTitle>
                            <AlertDialogDescription>{alertState.desc}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            {alertState.type === 'confirm' && (
                                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                            )}
                            <AlertDialogAction onClick={(e) => {
                                e.stopPropagation();
                                if (alertState.onConfirm) alertState.onConfirm();
                            }}>
                                Aceptar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    // Square card
    return (
        <div
            style={cardBase}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleClick}
        >
            {/* Subtle top-left accent glow */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 60,
                background: `linear-gradient(180deg, ${ring.bg}, transparent)`,
                borderRadius: '16px 16px 0 0',
                pointerEvents: 'none',
            }} />

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusDot status={table.status} />
                    <span style={{ color: C.text, fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em' }}>
                        Mesa {table.number}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.faint }}>
                    <Users size={12} />
                    <span style={{ fontSize: 12, color: C.faint }}>{table.capacity}</span>
                </div>
            </div>

            {/* Body */}
            {table.status === 'available' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Waiter selector */}
                    {waiters.length > 0 && (
                        <select
                            value={selectedWaiter}
                            onChange={e => { e.stopPropagation(); setSelectedWaiter(e.target.value); }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '100%', height: 28, borderRadius: 6,
                                background: C.card, border: `1px solid ${C.borderMid}`,
                                color: C.text, fontSize: 11, padding: '0 8px',
                                outline: 'none', cursor: 'pointer',
                            }}
                        >
                            <option value="" disabled>Seleccione mesero...</option>
                            {waiters.map(w => <option key={w.id} value={String(w.id)}>{w.name}</option>)}
                        </select>
                    )}
                    <button
                        onClick={handleOpenTable}
                        style={{
                            width: '100%', height: 34, borderRadius: 8,
                            background: `linear-gradient(135deg, ${C.teal}, ${C.tealDim})`,
                            border: 'none', color: '#fff',
                            fontWeight: 700, fontSize: 12,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            boxShadow: `0 2px 12px ${C.tealGlow}`,
                            letterSpacing: '0.01em',
                        }}
                    >
                        <Plus size={13} />
                        Abrir Mesa
                    </button>
                    {/* Edit table link */}
                    <a href={`/pos/tables/${table.id}/edit`}
                        onClick={e => e.stopPropagation()}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            color: C.faint, fontSize: 10, textDecoration: 'none',
                            marginTop: -2,
                        }}>
                        <Pencil size={10} /> Editar mesa
                    </a>
                </div>
            )}

            {table.status === 'occupied' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, position: 'relative' }}>
                    <InfoRow icon={<Clock size={12} color={C.red} />} label="Tiempo" value={table.time_open ?? '—'} valueColor={C.red} />
                    <InfoRow icon={<span style={{ fontSize: 11, color: C.teal, fontWeight: 700 }}>L.</span>} label="Total" value={fmtTotal(table.total)} valueColor={C.text} bold />
                    <InfoRow icon={<Users size={12} color={C.muted} />} label="Mesero" value={table.waiter_name ?? table.server_name ?? '—'} valueColor={C.muted} />

                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        {table.current_order_id && (
                            <ActionBtn label="Ver Orden" color={C.teal} onClick={handleGoToOrder} />
                        )}
                        <ActionBtn label="En Cocina" color={C.amber} onClick={handleMarkKitchen} />
                        <ActionBtn label="Liberar" color={C.red} onClick={handleRelease} />
                    </div>
                </div>
            )}

            {table.status === 'pending_food' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
                        <ChefHat size={22} color={C.amber} />
                        <div>
                            <div style={{ color: C.amber, fontSize: 13, fontWeight: 700 }}>Esperando comida</div>
                            <div style={{ color: C.muted, fontSize: 11 }}>{table.time_open ?? '—'} · {fmtTotal(table.total)}</div>
                        </div>
                    </div>
                    <InfoRow icon={<Users size={12} color={C.muted} />} label="Mesero" value={table.server_name ?? '—'} valueColor={C.muted} />

                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <ActionBtn label="Ver Pedido" color={C.teal} onClick={handleGoToOrder} />
                        <ActionBtn label="Servida" color={C.amber} onClick={(e) => { e.stopPropagation(); onStatusChange(table.id, 'occupied'); }} />
                        <ActionBtn label="Liberar" color={C.red} onClick={handleRelease} />
                    </div>
                </div>
            )}
            
            <AlertDialog open={alertState.open} onOpenChange={(open) => setAlertState(s => ({ ...s, open }))}>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertState.title}</AlertDialogTitle>
                        <AlertDialogDescription>{alertState.desc}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        {alertState.type === 'confirm' && (
                            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                        )}
                        <AlertDialogAction onClick={(e) => {
                            e.stopPropagation();
                            if (alertState.onConfirm) alertState.onConfirm();
                        }}>
                            Aceptar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

function StatusDot({ status }: { status: Table['status'] }) {
    const color = status === 'available' ? C.teal : status === 'occupied' ? C.red : C.amber;
    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <div style={{
                position: 'absolute', width: 14, height: 14, borderRadius: '50%',
                background: color, opacity: 0.2,
                animation: status !== 'available' ? 'pulse 2s ease-in-out infinite' : undefined,
            }} />
        </div>
    );
}

function InfoRow({ icon, label, value, valueColor, bold }: {
    icon: React.ReactNode; label: string; value: string; valueColor: string; bold?: boolean;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', width: 16, justifyContent: 'center' }}>{icon}</div>
            <span style={{ color: C.faint, fontSize: 11, flex: 1 }}>{label}</span>
            <span style={{ color: valueColor, fontSize: 12, fontWeight: bold ? 700 : 500, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
        </div>
    );
}

function ActionBtn({ label, color, onClick }: { label: string; color: string; onClick: (e: React.MouseEvent) => void }) {
    const [h, setH] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setH(true)}
            onMouseLeave={() => setH(false)}
            style={{
                flex: 1, height: 28, borderRadius: 6,
                background: h ? color : 'transparent',
                border: `1px solid ${color}`,
                color: h ? '#fff' : color,
                fontSize: 10, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.15s ease',
                letterSpacing: '0.02em',
            }}
        >
            {label}
        </button>
    );
}

// ── Section Group ─────────────────────────────────────────────────────────────
function SectionGroup({ name, tables, sessionId, waiters, onStatusChange }: {
    name: string;
    tables: Table[];
    sessionId: number | null;
    waiters: Waiter[];
    onStatusChange: (id: number, status: Table['status']) => void;
}) {
    return (
        <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ color: C.text, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {name}
                </span>
                <span style={{
                    fontSize: 10, fontWeight: 600, color: C.faint,
                    background: C.card, border: `1px solid ${C.borderMid}`,
                    borderRadius: 20, padding: '2px 8px',
                }}>
                    {tables.length} mesas
                </span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ color: C.teal, fontSize: 10 }}>
                    {tables.filter(t => t.status === 'available').length} libres
                </span>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))',
                gap: 16,
                alignItems: 'start',
            }}>
                {tables.map((table) => (
                    <TableCard
                        key={table.id}
                        table={table}
                        sessionId={sessionId}
                        waiters={waiters}
                        onStatusChange={onStatusChange}
                    />
                ))}
            </div>
        </div>
    );
}

// ── No Session Banner ─────────────────────────────────────────────────────────
function NoSessionBanner() {
    return (
        <div style={{
            margin: '0 0 24px 0',
            padding: '12px 20px',
            borderRadius: 10,
            background: 'rgba(245,158,11,0.08)',
            border: `1px solid rgba(245,158,11,0.3)`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CreditCard size={16} color={C.amber} />
                <span style={{ color: C.amber, fontSize: 13, fontWeight: 500 }}>
                    No hay caja abierta. Abre una sesión POS para poder tomar pedidos.
                </span>
            </div>
            <Link href="/pos/sessions/open" style={{ textDecoration: 'none' }}>
                <button style={{
                    padding: '6px 14px', borderRadius: 7,
                    background: C.amber, border: 'none',
                    color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                }}>
                    Abrir Caja
                </button>
            </Link>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TableBoard({ tables: initialTables, sections, activeSection: initialSection, activeView = 'all', activeSession, waiters }: Props) {
    const [search, setSearch] = useState('');
    const [activeSection, setActiveSection] = useState(initialSection);
    const [tables, setTables] = useState(initialTables);
    const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    // Sync tables when Inertia re-renders
    useEffect(() => { setTables(initialTables); }, [initialTables]);

    const refresh = useCallback(() => {
        router.reload({ only: ['tables', 'activeSession'] });
    }, []);

    // Auto-refresh every 30s
    useEffect(() => {
        refreshTimer.current = setInterval(refresh, 30_000);
        return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
    }, [refresh]);

    const handleSectionChange = (s: string) => {
        setActiveSection(s);
        router.get('/pos/tables', s !== 'all' ? { section: s } : {}, { preserveState: true, replace: true });
    };

    const handleStatusChange = (id: number, status: Table['status']) => {
        router.patch(`/pos/tables/${id}/status`, { status }, { preserveScroll: true });
    };

    // Client-side filter
    const filtered = tables.filter((t) => {
        if (activeView === 'kitchen' && t.status !== 'pending_food') return false;
        if (activeView === 'occupied' && t.status !== 'occupied') return false;

        if (!search) return true;
        const q = search.toLowerCase();
        return (
            `mesa ${t.number}`.includes(q) ||
            String(t.number).includes(q) ||
            (t.server_name?.toLowerCase().includes(q) ?? false) ||
            t.section.toLowerCase().includes(q)
        );
    });

    // Group by section preserving order
    const grouped = filtered.reduce<Record<string, Table[]>>((acc, t) => {
        (acc[t.section] ??= []).push(t);
        return acc;
    }, {});

    const stats = {
        total:     tables.length,
        available: tables.filter(t => t.status === 'available').length,
        occupied:  tables.filter(t => t.status === 'occupied').length,
        pending:   tables.filter(t => t.status === 'pending_food').length,
    };

    return (
        <>
            <Head title="Table Board — OneClick Restaurant" />

            {/* Pulse animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.2; }
                    50%       { transform: scale(1.6); opacity: 0; }
                }
                * { box-sizing: border-box; }
                input::placeholder { color: var(--muted-foreground); opacity: 0.5; }
                select option { background: var(--card); color: var(--card-foreground); }
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: var(--muted); }
            `}</style>

            <div style={{ display: 'flex', height: '100vh', background: C.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', overflow: 'hidden' }}>
                <Sidebar activeView={activeView} />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Header
                        stats={stats}
                        search={search}
                        onSearchChange={setSearch}
                        activeSection={activeSection}
                        sections={sections}
                        onSectionChange={handleSectionChange}
                        activeSession={activeSession}
                        onRefresh={refresh}
                    />

                    <main style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
                        {!activeSession && <NoSessionBanner />}

                        {Object.keys(grouped).length === 0 ? (
                            <EmptyState search={search} />
                        ) : (
                            Object.entries(grouped).map(([sectionName, sectionTables]) => (
                                <SectionGroup
                                    key={sectionName}
                                    name={sectionName}
                                    tables={sectionTables}
                                    sessionId={activeSession?.id ?? null}
                                    waiters={waiters}
                                    onStatusChange={handleStatusChange}
                                />
                            ))
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}

function EmptyState({ search }: { search: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
            <UtensilsCrossed size={40} color={C.faint} />
            <span style={{ color: C.muted, fontSize: 14 }}>
                {search ? `Sin resultados para "${search}"` : 'No hay mesas configuradas'}
            </span>
            {!search && (
                <span style={{ color: C.faint, fontSize: 12 }}>
                    Ejecuta el seeder: <code style={{ color: C.teal }}>php artisan db:seed --class=PosDatabaseSeeder</code>
                </span>
            )}
        </div>
    );
}

// Override layout — standalone full-screen terminal
(TableBoard as any).layout = null;
