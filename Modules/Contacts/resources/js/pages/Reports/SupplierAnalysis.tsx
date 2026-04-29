import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { Star, Truck } from 'lucide-react';

interface SupplierRow {
    id: number; name: string; rtn: string|null;
    total_purchases: number; last_purchase_date: string|null;
    quality_rating: number|null; delivery_rating: number|null;
    communication_rating: number|null; price_rating: number|null;
    overall_rating: number|null; on_time_delivery_percent: number;
}
interface Props {
    suppliers: SupplierRow[];
    summary: { total_suppliers: number; avg_rating: number|null };
}

const fmt = (n: number) => new Intl.NumberFormat('es-HN', { minimumFractionDigits: 2 }).format(n);

function RatingBadge({ value }: { value: number|null }) {
    if (value === null) return <span className="text-xs text-muted-foreground">N/A</span>;
    const color = value >= 4 ? 'text-green-600' : value >= 3 ? 'text-amber-600' : 'text-red-600';
    return (
        <span className={`flex items-center gap-0.5 text-xs font-medium ${color}`}>
            <Star className="h-3 w-3 fill-current" />{value.toFixed(1)}
        </span>
    );
}

export default function SupplierAnalysisReport({ suppliers, summary }: Props) {
    return (
        <>
            <Head title="Análisis de Proveedores" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <Link href="/contacts"><Button variant="ghost" size="sm" className="pl-1">← Contactos</Button></Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold flex items-center gap-2"><Truck className="h-5 w-5" />Análisis de Proveedores</h1>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Card>
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30"><Truck className="h-5 w-5 text-blue-600" /></div>
                            <div><p className="text-sm text-muted-foreground">Total proveedores</p><p className="text-2xl font-bold">{summary.total_suppliers}</p></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6 flex items-center gap-4">
                            <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30"><Star className="h-5 w-5 text-amber-500 fill-current" /></div>
                            <div>
                                <p className="text-sm text-muted-foreground">Rating promedio</p>
                                <p className="text-2xl font-bold">{summary.avg_rating !== null ? summary.avg_rating.toFixed(1) : 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base">Proveedores por rating</CardTitle></CardHeader>
                    <CardContent>
                        {suppliers.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                                <Truck className="h-8 w-8 opacity-30" />
                                <p className="text-sm">No hay proveedores registrados.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 pr-4 font-medium">Proveedor</th>
                                            <th className="pb-2 pr-4 font-medium text-center">General</th>
                                            <th className="pb-2 pr-4 font-medium text-center">Calidad</th>
                                            <th className="pb-2 pr-4 font-medium text-center">Entregas</th>
                                            <th className="pb-2 pr-4 font-medium text-center">Comunic.</th>
                                            <th className="pb-2 pr-4 font-medium text-center">Precio</th>
                                            <th className="pb-2 pr-4 font-medium text-center">A tiempo</th>
                                            <th className="pb-2 font-medium text-right">Total compras</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {suppliers.map(s => (
                                            <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                <td className="py-2 pr-4">
                                                    <Link href={`/contacts/${s.id}/edit`} className="font-medium hover:text-primary hover:underline">{s.name}</Link>
                                                    {s.last_purchase_date && <p className="text-xs text-muted-foreground">Última compra: {s.last_purchase_date}</p>}
                                                </td>
                                                <td className="py-2 pr-4 text-center"><RatingBadge value={s.overall_rating} /></td>
                                                <td className="py-2 pr-4 text-center"><RatingBadge value={s.quality_rating} /></td>
                                                <td className="py-2 pr-4 text-center"><RatingBadge value={s.delivery_rating} /></td>
                                                <td className="py-2 pr-4 text-center"><RatingBadge value={s.communication_rating} /></td>
                                                <td className="py-2 pr-4 text-center"><RatingBadge value={s.price_rating} /></td>
                                                <td className="py-2 pr-4 text-center text-xs">{s.on_time_delivery_percent.toFixed(0)}%</td>
                                                <td className="py-2 text-right text-xs">L {fmt(s.total_purchases)}</td>
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

SupplierAnalysisReport.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contactos', href: '/contacts' },
        { title: 'Análisis de Proveedores', href: '#' },
    ],
};
