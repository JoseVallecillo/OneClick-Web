import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Edit, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type MoveState = 'draft' | 'posted' | 'cancelled';

interface MoveLine {
    id: number;
    account: { id: number; code: string; name: string };
    partner: { id: number; name: string } | null;
    name: string | null;
    debit: string;
    credit: string;
}

interface Move {
    id: number;
    reference: string;
    date: string;
    narration: string | null;
    state: MoveState;
    journal: { id: number; name: string; code: string };
    creator: { id: number; name: string };
    poster: { id: number; name: string } | null;
    posted_at: string | null;
    reverse_of: { id: number; reference: string } | null;
    lines: MoveLine[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATE_MAP: Record<MoveState, { label: string; className: string }> = {
    draft:     { label: 'Borrador',  className: 'border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400' },
    posted:    { label: 'Publicado', className: 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    cancelled: { label: 'Anulado',   className: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

function fmtDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function fmtNum(v: string | number) {
    return Number(v).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MoveShow({ move }: { move: Move }) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [reverseNote, setReverseNote]     = useState('');
    const [showReverse, setShowReverse]     = useState(false);

    const totalDebit  = move.lines.reduce((s, l) => s + Number(l.debit), 0);
    const totalCredit = move.lines.reduce((s, l) => s + Number(l.credit), 0);
    const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.0001;

    function handlePost() {
        router.post(`/accounting/moves/${move.id}/post`, {});
    }

    function handleDelete() {
        router.delete(`/accounting/moves/${move.id}`);
    }

    function handleReverse() {
        router.post(`/accounting/moves/${move.id}/reverse`, { narration: reverseNote });
        setShowReverse(false);
    }

    const stateInfo = STATE_MAP[move.state];

    return (
        <>
            <Head title={`Asiento ${move.reference}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 max-w-5xl">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                {/* Header actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/accounting/moves">
                            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                                <ArrowLeft className="h-4 w-4" /> Volver
                            </Button>
                        </Link>
                        <h1 className="text-lg font-semibold font-mono">{move.reference}</h1>
                        <Badge className={`text-[10px] border ${stateInfo.className}`}>{stateInfo.label}</Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        {move.state === 'draft' && (
                            <>
                                <Link href={`/accounting/moves/${move.id}/edit`}>
                                    <Button variant="outline" size="sm" className="gap-1.5 h-8">
                                        <Edit className="h-3.5 w-3.5" /> Editar
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 h-8 border-green-200 text-green-700 hover:bg-green-50"
                                    onClick={handlePost}
                                    disabled={!isBalanced}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Publicar
                                </Button>
                                {confirmDelete ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-red-600">¿Confirmar eliminación?</span>
                                        <Button variant="destructive" size="sm" className="h-8 text-xs" onClick={handleDelete}>Sí, eliminar</Button>
                                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" size="sm" className="gap-1.5 h-8 border-red-200 text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
                                        <Trash2 className="h-3.5 w-3.5" /> Eliminar
                                    </Button>
                                )}
                            </>
                        )}
                        {move.state === 'posted' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 h-8 border-amber-200 text-amber-700 hover:bg-amber-50"
                                onClick={() => setShowReverse(true)}
                            >
                                <RotateCcw className="h-3.5 w-3.5" /> Revertir
                            </Button>
                        )}
                    </div>
                </div>

                {/* Reversal dialog */}
                {showReverse && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-amber-800">Revertir asiento publicado</p>
                                <p className="text-xs text-amber-700 mt-1">Se creará un asiento de reversión con los montos invertidos. El asiento original quedará anulado.</p>
                                <div className="mt-3 flex items-center gap-2">
                                    <input
                                        className="flex-1 rounded border border-amber-300 bg-white px-3 py-1.5 text-sm"
                                        placeholder="Motivo de reversión (opcional)"
                                        value={reverseNote}
                                        onChange={(e) => setReverseNote(e.target.value)}
                                    />
                                    <Button size="sm" className="h-8" onClick={handleReverse}>Confirmar reversión</Button>
                                    <Button variant="outline" size="sm" className="h-8" onClick={() => setShowReverse(false)}>Cancelar</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Balance warning */}
                {!isBalanced && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Partida doble no balanceada: Debe {fmtNum(totalDebit)} ≠ Haber {fmtNum(totalCredit)}
                    </div>
                )}

                {/* Move metadata */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Datos del Asiento</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm md:grid-cols-4">
                            <div>
                                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Referencia</dt>
                                <dd className="mt-0.5 font-mono font-semibold">{move.reference}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fecha</dt>
                                <dd className="mt-0.5">{fmtDate(move.date)}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Diario</dt>
                                <dd className="mt-0.5">{move.journal.name}</dd>
                            </div>
                            <div>
                                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Creado por</dt>
                                <dd className="mt-0.5">{move.creator.name}</dd>
                            </div>
                            {move.narration && (
                                <div className="col-span-2 md:col-span-4">
                                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Narración</dt>
                                    <dd className="mt-0.5 text-muted-foreground">{move.narration}</dd>
                                </div>
                            )}
                            {move.poster && (
                                <div>
                                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Publicado por</dt>
                                    <dd className="mt-0.5">{move.poster.name} — {fmtDate(move.posted_at)}</dd>
                                </div>
                            )}
                            {move.reverse_of && (
                                <div>
                                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Reversión de</dt>
                                    <dd className="mt-0.5">
                                        <Link href={`/accounting/moves/${move.reverse_of.id}`} className="font-mono text-primary hover:underline">
                                            {move.reverse_of.reference}
                                        </Link>
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </CardContent>
                </Card>

                {/* Lines — Apuntes Contables */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Apuntes Contables</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                        <th className="pb-2 pr-4 font-semibold">Cuenta</th>
                                        <th className="pb-2 pr-4 font-semibold">Socio / Contacto</th>
                                        <th className="pb-2 pr-4 font-semibold">Descripción</th>
                                        <th className="pb-2 pr-4 font-semibold text-right">Debe</th>
                                        <th className="pb-2 font-semibold text-right">Haber</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {move.lines.map((line) => (
                                        <tr key={line.id} className="border-b last:border-0 hover:bg-muted/20">
                                            <td className="py-2.5 pr-4">
                                                <span className="font-mono text-xs text-muted-foreground">{line.account.code}</span>
                                                <span className="ml-2 text-[13px]">{line.account.name}</span>
                                            </td>
                                            <td className="py-2.5 pr-4 text-xs text-muted-foreground">{line.partner?.name ?? '—'}</td>
                                            <td className="py-2.5 pr-4 text-xs text-muted-foreground max-w-[200px] truncate">{line.name ?? '—'}</td>
                                            <td className="py-2.5 pr-4 text-right font-mono text-xs tabular-nums">
                                                {Number(line.debit) > 0 ? fmtNum(line.debit) : '—'}
                                            </td>
                                            <td className="py-2.5 text-right font-mono text-xs tabular-nums">
                                                {Number(line.credit) > 0 ? fmtNum(line.credit) : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 font-semibold">
                                        <td colSpan={3} className="pt-2 text-xs uppercase tracking-wider text-muted-foreground">Totales</td>
                                        <td className={`pt-2 text-right font-mono text-sm tabular-nums ${!isBalanced ? 'text-red-600' : ''}`}>
                                            {fmtNum(totalDebit)}
                                        </td>
                                        <td className={`pt-2 text-right font-mono text-sm tabular-nums ${!isBalanced ? 'text-red-600' : ''}`}>
                                            {fmtNum(totalCredit)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

MoveShow.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Libro Diario', href: '/accounting/moves' },
        { title: 'Asiento', href: '#' },
    ],
};
