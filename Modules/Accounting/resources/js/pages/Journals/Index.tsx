import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, Edit, Plus } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type JournalType = 'sales' | 'purchases' | 'bank' | 'cash' | 'general';

interface JournalRow {
    id: number;
    name: string;
    code: string;
    type: JournalType;
    active: boolean;
    moves_count: number;
    default_debit_account: { id: number; code: string; name: string } | null;
    default_credit_account: { id: number; code: string; name: string } | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const TYPE_MAP: Record<JournalType, { label: string; className: string }> = {
    sales:     { label: 'Ventas',   className: 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    purchases: { label: 'Compras',  className: 'border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
    bank:      { label: 'Banco',    className: 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300' },
    cash:      { label: 'Caja',     className: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
    general:   { label: 'Varios',   className: 'border-gray-300 bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400' },
};

export default function JournalsIndex({ journals }: { journals: JournalRow[] }) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const flash = props.flash;

    return (
        <>
            <Head title="Diarios" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>
                )}

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{journals.length} diario(s) configurados</span>
                            <Link href="/accounting/journals/create">
                                <Button size="sm" variant="outline" className="h-9 gap-1.5 bg-white text-black border-zinc-200 hover:bg-zinc-100 dark:bg-white dark:text-black">
                                    <Plus className="h-4 w-4" /> Nuevo Diario
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {journals.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <BookOpen className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No hay diarios configurados.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                            <th className="pb-2 pr-4 font-semibold">Código</th>
                                            <th className="pb-2 pr-4 font-semibold">Nombre</th>
                                            <th className="pb-2 pr-4 font-semibold">Tipo</th>
                                            <th className="pb-2 pr-4 font-semibold">Cuenta Débito</th>
                                            <th className="pb-2 pr-4 font-semibold">Cuenta Crédito</th>
                                            <th className="pb-2 pr-4 font-semibold text-center">Asientos</th>
                                            <th className="pb-2 font-semibold">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {journals.map((j) => {
                                            const typeInfo = TYPE_MAP[j.type];
                                            return (
                                                <tr key={j.id} className="border-b last:border-0 hover:bg-muted/30">
                                                    <td className="py-2.5 pr-4 font-mono text-xs font-semibold">{j.code}</td>
                                                    <td className="py-2.5 pr-4">
                                                        <span className="text-[13px] font-medium">{j.name}</span>
                                                        {!j.active && <span className="ml-2 text-[10px] text-muted-foreground">(inactivo)</span>}
                                                    </td>
                                                    <td className="py-2.5 pr-4">
                                                        <Badge className={`text-[10px] border ${typeInfo.className}`}>{typeInfo.label}</Badge>
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                                                        {j.default_debit_account
                                                            ? <span><span className="font-mono">{j.default_debit_account.code}</span> {j.default_debit_account.name}</span>
                                                            : '—'}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                                                        {j.default_credit_account
                                                            ? <span><span className="font-mono">{j.default_credit_account.code}</span> {j.default_credit_account.name}</span>
                                                            : '—'}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-center text-xs tabular-nums">{j.moves_count}</td>
                                                    <td className="py-2.5">
                                                        <Link href={`/accounting/journals/${j.id}/edit`}>
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

JournalsIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Diarios', href: '/accounting/journals' },
    ],
};
