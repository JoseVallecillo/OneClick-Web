import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, DollarSign, Users } from 'lucide-react';

interface DebtorRow {
    id: number; name: string; rtn: string|null;
    outstanding_balance: number; credit_limit: number;
    last_payment_date: string|null; days_overdue: number|null;
}
interface Paginated { data: DebtorRow[]; links: { url: string|null; label: string; active: boolean }[]; total?: number; }
interface Props {
    debtors: Paginated;
    summary: { total_debtors: number; total_debt: number };
}

const fmt = (n: number) => new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n);

function riskColor(days: number|null) {
    if (!days) return 'text-muted-foreground';
    if (days > 90) return 'text-red-600 font-bold';
    if (days > 30) return 'text-amber-600';
    return 'text-muted-foreground';
}

export default function DebtorsReport({ debtors, summary }: Props) {
    return (
        <>
            <Head title="Clientes Morosos" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <Link href="/contacts"><Button variant="ghost" size="sm" className="pl-1">← Contactos</Button></Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-500" />Clientes Morosos</h1>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30"><Users className="h-5 w-5 text-red-600" /></div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total deudores</p>
                                <p className="text-2xl font-bold">{summary.total_debtors}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30"><DollarSign className="h-5 w-5 text-amber-600" /></div>
                            <div>
                                <p className="text-sm text-muted-foreground">Deuda total</p>
                                <p className="text-2xl font-bold">L {fmt(summary.total_debt)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Detalle de deudores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {debtors.data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                                <AlertCircle className="h-8 w-8 opacity-30" />
                                <p className="text-sm">No hay clientes con saldo pendiente.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-muted-foreground">
                                                <th className="pb-2 pr-4 font-medium">Cliente</th>
                                                <th className="pb-2 pr-4 font-medium">RTN</th>
                                                <th className="pb-2 pr-4 font-medium text-right">Saldo pendiente</th>
                                                <th className="pb-2 pr-4 font-medium text-right">Límite crédito</th>
                                                <th className="pb-2 pr-4 font-medium">Último pago</th>
                                                <th className="pb-2 font-medium">Días mora</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {debtors.data.map(d => (
                                                <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                    <td className="py-2 pr-4">
                                                        <Link href={`/contacts/${d.id}/edit`} className="font-medium hover:text-primary hover:underline">{d.name}</Link>
                                                    </td>
                                                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{d.rtn ?? '—'}</td>
                                                    <td className="py-2 pr-4 text-right font-medium text-red-600">L {fmt(d.outstanding_balance)}</td>
                                                    <td className="py-2 pr-4 text-right text-muted-foreground">{d.credit_limit > 0 ? `L ${fmt(d.credit_limit)}` : '—'}</td>
                                                    <td className="py-2 pr-4 text-xs text-muted-foreground">{d.last_payment_date ?? 'Sin pagos'}</td>
                                                    <td className="py-2">
                                                        {d.days_overdue !== null
                                                            ? <span className={riskColor(d.days_overdue)}>{d.days_overdue} días</span>
                                                            : <Badge variant="destructive" className="text-[10px]">Sin historial</Badge>
                                                        }
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {debtors.links.length > 3 && (
                                    <div className="flex justify-center gap-1 pt-4">
                                        {debtors.links.map((link, i) => (
                                            <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm"
                                                className="h-7 min-w-[28px] px-2 text-xs" disabled={!link.url || link.active}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                                dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ))}
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

DebtorsReport.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contactos', href: '/contacts' },
        { title: 'Clientes Morosos', href: '#' },
    ],
};
