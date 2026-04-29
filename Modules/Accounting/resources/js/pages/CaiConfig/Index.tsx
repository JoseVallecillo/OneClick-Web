import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, Eye, KeyRound, Plus } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CaiRow {
    id: number;
    cai: string;
    range_from: string;
    range_to: string;
    current_number: string | null;
    expires_at: string;
    active: boolean;
    journal: { id: number; name: string; code: string };
    establishment_code: string | null;
    terminal_code: string | null;
}

interface PaginatedConfigs {
    data: CaiRow[];
    meta: { total: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function isExpired(expiresAt: string) {
    return new Date(expiresAt) < new Date();
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CaiConfigIndex({ configs }: { configs: PaginatedConfigs }) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const flash = props.flash;

    const { data } = configs;
    const meta = configs.meta ?? { total: data.length };

    return (
        <>
            <Head title="Configuración CAI" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>
                )}

                {/* Honduras SAR info banner */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-start gap-2">
                    <KeyRound className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                        <strong>CAI — Clave de Autorización de Impresión (SAR Honduras).</strong>{' '}
                        Cada CAI tiene un rango de correlativo autorizado y una fecha de vencimiento.
                        El sistema incrementa el número correlativo automáticamente al emitir cada factura.
                    </span>
                </div>

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{meta.total} CAI(s) registrados</span>
                            <Link href="/accounting/cai/create">
                                <Button size="sm" variant="outline" className="h-9 gap-1.5 bg-white text-black border-zinc-200 hover:bg-zinc-100 dark:bg-white dark:text-black">
                                    <Plus className="h-4 w-4" /> Registrar CAI
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <KeyRound className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No hay CAIs registrados.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                            <th className="pb-2 pr-4 font-semibold">CAI</th>
                                            <th className="pb-2 pr-4 font-semibold">Diario</th>
                                            <th className="pb-2 pr-4 font-semibold">Rango</th>
                                            <th className="pb-2 pr-4 font-semibold">Correlativo actual</th>
                                            <th className="pb-2 pr-4 font-semibold">Vence</th>
                                            <th className="pb-2 pr-4 font-semibold">Estado</th>
                                            <th className="pb-2 font-semibold">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((c) => {
                                            const expired = isExpired(c.expires_at);
                                            return (
                                                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                                                    <td className="py-2.5 pr-4">
                                                        <span className="font-mono text-xs">{c.cai}</span>
                                                        {c.establishment_code && (
                                                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                                                Est: {c.establishment_code} / Pto: {c.terminal_code}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-xs">{c.journal.name}</td>
                                                    <td className="py-2.5 pr-4 text-xs font-mono tabular-nums">
                                                        {c.range_from} — {c.range_to}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-xs font-mono tabular-nums">
                                                        {c.current_number ?? '—'}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-xs">
                                                        <span className={expired ? 'text-red-600 font-semibold' : ''}>{fmtDate(c.expires_at)}</span>
                                                        {expired && <AlertTriangle className="inline-block ml-1 h-3 w-3 text-red-600" />}
                                                    </td>
                                                    <td className="py-2.5 pr-4">
                                                        <Badge className={`text-[10px] border ${c.active && !expired ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'}`}>
                                                            {!c.active ? 'Inactivo' : expired ? 'Vencido' : 'Vigente'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2.5">
                                                        <Link href={`/accounting/cai/${c.id}`}>
                                                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                                                                <Eye className="h-3.5 w-3.5" /> Ver
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CaiConfigIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Configuración CAI', href: '/accounting/cai' },
    ],
};
