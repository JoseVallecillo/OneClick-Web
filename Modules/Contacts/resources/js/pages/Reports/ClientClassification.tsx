import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { DollarSign, TrendingUp, Users } from 'lucide-react';

interface ClientRow {
    id: number; name: string; rtn: string|null;
    total_purchases: number; outstanding_balance: number;
    last_purchase_date: string|null; days_since_purchase: number|null;
    classification: string|null;
}
interface Props {
    clients: ClientRow[];
    summary: { total_clients: number; total_sales: number; avg_sale_value: number };
}

const fmt = (n: number) => new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n);

function ClassBadge({ value }: { value: string|null }) {
    if (!value) return <span className="text-xs text-muted-foreground">Sin clasificar</span>;
    const colors: Record<string, string> = {
        vip: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        wholesale: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        retail: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[value] ?? 'bg-muted text-muted-foreground'}`}>{value}</span>;
}

function recencyColor(days: number|null) {
    if (!days) return 'text-muted-foreground';
    if (days > 180) return 'text-red-600';
    if (days > 90)  return 'text-amber-600';
    return 'text-green-600';
}

export default function ClientClassificationReport({ clients, summary }: Props) {
    return (
        <>
            <Head title="Clasificación de Clientes" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <Link href="/contacts"><Button variant="ghost" size="sm" className="pl-1">← Contactos</Button></Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5" />Clasificación de Clientes</h1>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30"><Users className="h-5 w-5 text-blue-600" /></div>
                            <div><p className="text-sm text-muted-foreground">Total clientes</p><p className="text-2xl font-bold">{summary.total_clients}</p></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30"><DollarSign className="h-5 w-5 text-green-600" /></div>
                            <div><p className="text-sm text-muted-foreground">Ventas totales</p><p className="text-2xl font-bold">L {fmt(summary.total_sales)}</p></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30"><TrendingUp className="h-5 w-5 text-purple-600" /></div>
                            <div><p className="text-sm text-muted-foreground">Venta promedio</p><p className="text-2xl font-bold">L {fmt(summary.avg_sale_value)}</p></div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base">Clientes por valor de compra</CardTitle></CardHeader>
                    <CardContent>
                        {clients.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                                <Users className="h-8 w-8 opacity-30" />
                                <p className="text-sm">No hay clientes registrados.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 pr-4 font-medium">#</th>
                                            <th className="pb-2 pr-4 font-medium">Cliente</th>
                                            <th className="pb-2 pr-4 font-medium">Clasificación</th>
                                            <th className="pb-2 pr-4 font-medium text-right">Total compras</th>
                                            <th className="pb-2 pr-4 font-medium text-right">Saldo pendiente</th>
                                            <th className="pb-2 font-medium">Última compra</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clients.map((c, idx) => (
                                            <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                <td className="py-2 pr-4 text-xs text-muted-foreground">{idx + 1}</td>
                                                <td className="py-2 pr-4">
                                                    <Link href={`/contacts/${c.id}/edit`} className="font-medium hover:text-primary hover:underline">{c.name}</Link>
                                                    {c.rtn && <p className="text-xs text-muted-foreground font-mono">RTN: {c.rtn}</p>}
                                                </td>
                                                <td className="py-2 pr-4"><ClassBadge value={c.classification} /></td>
                                                <td className="py-2 pr-4 text-right font-medium">L {fmt(c.total_purchases)}</td>
                                                <td className="py-2 pr-4 text-right">
                                                    {c.outstanding_balance > 0
                                                        ? <span className="text-red-600">L {fmt(c.outstanding_balance)}</span>
                                                        : <span className="text-muted-foreground">—</span>
                                                    }
                                                </td>
                                                <td className="py-2">
                                                    {c.last_purchase_date
                                                        ? <span className={`text-xs ${recencyColor(c.days_since_purchase)}`}>{c.last_purchase_date}{c.days_since_purchase !== null && ` (hace ${c.days_since_purchase} días)`}</span>
                                                        : <Badge variant="outline" className="text-[10px]">Sin compras</Badge>
                                                    }
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

ClientClassificationReport.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contactos', href: '/contacts' },
        { title: 'Clasificación de Clientes', href: '#' },
    ],
};
