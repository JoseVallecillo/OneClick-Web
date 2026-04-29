import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head } from '@inertiajs/react';

interface Asset {
    id: number;
    code: string;
    name: string;
    acquisition_cost: number;
    accumulated_depreciation: number;
    useful_life_years: number;
    account?: { code: string; name: string };
}

interface Props {
    assets: Asset[];
    totalAcquisitionCost: number;
    totalAccumulatedDepreciation: number;
    totalNetBookValue: number;
}

export default function FixedAssetsReport({ assets, totalAcquisitionCost, totalAccumulatedDepreciation, totalNetBookValue }: Props) {
    return (
        <>
            <Head title="Reporte de Activos Fijos" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Card>
                    <CardHeader className="pb-4">
                        <h2 className="font-bold text-lg">Reporte de Activos Fijos</h2>
                    </CardHeader>

                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                        <th className="pb-2 pr-3 font-semibold">Código</th>
                                        <th className="pb-2 pr-3 font-semibold">Nombre</th>
                                        <th className="pb-2 pr-3 font-semibold">Cuenta</th>
                                        <th className="pb-2 pr-3 font-semibold text-right">Costo</th>
                                        <th className="pb-2 pr-3 font-semibold text-right">Depreciación</th>
                                        <th className="pb-2 pr-3 font-semibold text-right">Valor Neto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assets.map((asset) => (
                                        <tr key={asset.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="py-2.5 pr-3 font-mono text-xs">{asset.code}</td>
                                            <td className="py-2.5 pr-3">{asset.name}</td>
                                            <td className="py-2.5 pr-3 text-xs">{asset.account?.code}</td>
                                            <td className="py-2.5 pr-3 text-right font-mono text-xs">{asset.acquisition_cost.toFixed(2)}</td>
                                            <td className="py-2.5 pr-3 text-right font-mono text-xs">{asset.accumulated_depreciation.toFixed(2)}</td>
                                            <td className="py-2.5 pr-3 text-right font-mono text-xs">{(asset.acquisition_cost - asset.accumulated_depreciation).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="border-t font-semibold bg-muted/50">
                                        <td colSpan={3} className="py-3 pr-3">TOTALES</td>
                                        <td className="py-3 pr-3 text-right">{totalAcquisitionCost.toFixed(2)}</td>
                                        <td className="py-3 pr-3 text-right">{totalAccumulatedDepreciation.toFixed(2)}</td>
                                        <td className="py-3 pr-3 text-right">{totalNetBookValue.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

FixedAssetsReport.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Activos Fijos', href: '/accounting/reports/fixed-assets' },
    ],
};
