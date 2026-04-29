import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link, usePage } from '@inertiajs/react';
import { Edit, Plus, Receipt } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface TaxRow {
    id: number;
    name: string;
    code: string;
    type: 'percentage' | 'fixed' | 'exempt';
    rate: string;
    tax_scope: 'sales' | 'purchases' | 'all';
    active: boolean;
}

interface PaginatedTaxes {
    data: TaxRow[];
    meta: { current_page: number; last_page: number; from: number | null; to: number | null; total: number };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const SCOPE_LABELS: Record<string, string> = {
    sales: 'Ventas', purchases: 'Compras', all: 'Todos',
};

function fmtRate(tax: TaxRow) {
    if (tax.type === 'exempt') return 'Exento';
    if (tax.type === 'fixed')  return `L. ${Number(tax.rate).toFixed(2)}`;
    return `${Number(tax.rate).toFixed(2)} %`;
}

export default function TaxesIndex({ taxes }: { taxes: PaginatedTaxes }) {
    const { props } = usePage<{ flash?: { success?: string; setup_notice?: string } }>();
    const flash = props.flash;

    const { data } = taxes;
    const meta = taxes.meta ?? { current_page: 1, last_page: 1, from: null, to: null, total: data.length };

    return (
        <>
            <Head title="Impuestos" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {flash?.setup_notice && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        ⚠️ {flash.setup_notice}
                    </div>
                )}
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>
                )}

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{meta.total} impuesto(s)</span>
                            <Link href="/accounting/taxes/create">
                                <Button size="sm" variant="outline" className="h-9 gap-1.5 bg-white text-black border-zinc-200 hover:bg-zinc-100 dark:bg-white dark:text-black">
                                    <Plus className="h-4 w-4" /> Nuevo Impuesto
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <Receipt className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No hay impuestos configurados.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                            <th className="pb-2 pr-4 font-semibold">Código</th>
                                            <th className="pb-2 pr-4 font-semibold">Nombre</th>
                                            <th className="pb-2 pr-4 font-semibold">Tasa / Monto</th>
                                            <th className="pb-2 pr-4 font-semibold">Alcance</th>
                                            <th className="pb-2 pr-4 font-semibold">Estado</th>
                                            <th className="pb-2 font-semibold">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((t) => (
                                            <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="py-2.5 pr-4 font-mono text-xs font-semibold">{t.code}</td>
                                                <td className="py-2.5 pr-4 text-[13px]">{t.name}</td>
                                                <td className="py-2.5 pr-4 text-xs font-mono tabular-nums">{fmtRate(t)}</td>
                                                <td className="py-2.5 pr-4 text-xs text-muted-foreground">{SCOPE_LABELS[t.tax_scope]}</td>
                                                <td className="py-2.5 pr-4">
                                                    <Badge className={`text-[10px] border ${t.active ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-300 bg-gray-50 text-gray-600'}`}>
                                                        {t.active ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </td>
                                                <td className="py-2.5">
                                                    <Link href={`/accounting/taxes/${t.id}/edit`}>
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

TaxesIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Impuestos', href: '/accounting/taxes' },
    ],
};
