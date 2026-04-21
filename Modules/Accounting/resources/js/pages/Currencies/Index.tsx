import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { DollarSign, Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface CurrencyRow {
    id: number;
    code: string;
    name: string;
    symbol: string;
    exchange_rate: string;
    is_primary: boolean;
    active: boolean;
}

export default function CurrenciesIndex({ currencies }: { currencies: CurrencyRow[] }) {
    const { props } = usePage<{ flash?: { success?: string; setup_notice?: string }; errors?: Record<string, string> }>();
    const flash = props.flash;
    const errors = props.errors ?? {};
    const [deletingId, setDeletingId] = useState<number | null>(null);

    function deleteCurrency(c: CurrencyRow) {
        if (!confirm(`¿Eliminar la moneda "${c.name}"?`)) return;
        setDeletingId(c.id);
        router.delete(`/accounting/currencies/${c.id}`, { onFinish: () => setDeletingId(null) });
    }

    return (
        <>
            <Head title="Monedas" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {flash?.setup_notice && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
                        <span>⚠️ {flash.setup_notice}</span>
                    </div>
                )}
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>
                )}
                {errors.currency && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{errors.currency}</div>
                )}

                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{currencies.length} moneda(s)</span>
                            <Link href="/accounting/currencies/create">
                                <Button size="sm" variant="outline" className="h-9 gap-1.5 bg-white text-black border-zinc-200 hover:bg-zinc-100 dark:bg-white dark:text-black">
                                    <Plus className="h-4 w-4" /> Nueva Moneda
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {currencies.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                                <DollarSign className="h-8 w-8 opacity-40" />
                                <p className="text-sm">No hay monedas configuradas.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                            <th className="pb-2 pr-4 font-semibold">Código</th>
                                            <th className="pb-2 pr-4 font-semibold">Nombre</th>
                                            <th className="pb-2 pr-4 font-semibold">Símbolo</th>
                                            <th className="pb-2 pr-4 font-semibold">Tasa de cambio</th>
                                            <th className="pb-2 pr-4 font-semibold">Estado</th>
                                            <th className="pb-2 font-semibold">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currencies.map((c) => (
                                            <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                                                <td className="py-2.5 pr-4 font-mono font-semibold text-xs">
                                                    {c.code}
                                                    {c.is_primary && (
                                                        <Badge className="ml-2 text-[10px] border-blue-300 bg-blue-50 text-blue-700">Principal</Badge>
                                                    )}
                                                </td>
                                                <td className="py-2.5 pr-4 text-[13px]">{c.name}</td>
                                                <td className="py-2.5 pr-4 font-mono">{c.symbol}</td>
                                                <td className="py-2.5 pr-4 font-mono text-xs tabular-nums text-muted-foreground">
                                                    {c.is_primary ? '1.000000' : Number(c.exchange_rate).toFixed(6)}
                                                </td>
                                                <td className="py-2.5 pr-4">
                                                    <Badge className={`text-[10px] border ${c.active ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-300 bg-gray-50 text-gray-600'}`}>
                                                        {c.active ? 'Activa' : 'Inactiva'}
                                                    </Badge>
                                                </td>
                                                <td className="py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/accounting/currencies/${c.id}/edit`}>
                                                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                                                                <Edit className="h-3.5 w-3.5" /> Editar
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost" size="sm"
                                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                            disabled={c.is_primary || deletingId === c.id}
                                                            title={c.is_primary ? 'No puedes eliminar la moneda principal' : ''}
                                                            onClick={() => deleteCurrency(c)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
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

CurrenciesIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Monedas', href: '/accounting/currencies' },
    ],
};
