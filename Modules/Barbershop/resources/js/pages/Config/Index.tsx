import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head } from '@inertiajs/react';
import { Settings } from 'lucide-react';

export default function BarbershopConfig() {
    return (
        <>
            <Head title="Configuración — Barbería" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-xl font-bold">Configuración de Barbería</h1>
                    <p className="text-sm text-muted-foreground">Opciones generales para la barbería.</p>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Ajustes Generales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border p-4 bg-muted/20 text-sm text-muted-foreground">
                            <p>
                                <strong>Nota:</strong> Las categorías de los servicios se administran a nivel global a través del módulo de <strong>Inventario &gt; Configuración</strong>, ya que cada servicio de barbería está enlazado a un producto del sistema general.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

BarbershopConfig.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Barbería', href: '/barbershop' },
        { title: 'Configuración', href: '/barbershop/config' },
    ],
};
