import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, router, usePage } from '@inertiajs/react';
import { BadgeCheck, ShieldX } from 'lucide-react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface LicenseRecord {
    company: { commercial_name: string };
    plan: {
        name: string;
        duration_days: number;
        user_limit: number | null;
    };
    expires_at: string;
}

interface Props {
    token: string | null;
    record: LicenseRecord | null;
    error: string | null;
    [key: string]: unknown;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function Activate() {
    const { token, record, error } = usePage<Props>().props;
    const [confirming, setConfirming] = useState(false);

    function handleActivate() {
        setConfirming(true);
        router.post('/activate-license', { token }, {
            onFinish: () => setConfirming(false),
        });
    }

    return (
        <>
            <Head title="Activar licencia" />

            <div className="flex flex-1 items-center justify-center p-8">
                <Card className="w-full max-w-md">
                    {error ? (
                        <>
                            <CardHeader className="items-center text-center pb-2">
                                <ShieldX className="h-12 w-12 text-red-500 mb-2" />
                                <CardTitle>Token inválido</CardTitle>
                                <CardDescription>{error}</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center">
                                <Button variant="outline" onClick={() => router.visit('/subscriptions')}>
                                    Ir a suscripciones
                                </Button>
                            </CardContent>
                        </>
                    ) : (
                        <>
                            <CardHeader className="items-center text-center pb-2">
                                <BadgeCheck className="h-12 w-12 text-green-500 mb-2" />
                                <CardTitle>Activar licencia</CardTitle>
                                <CardDescription>
                                    Confirma los detalles antes de activar.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Empresa</span>
                                        <span className="font-medium">{record?.company.commercial_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Plan</span>
                                        <span className="font-medium">{record?.plan.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Duración</span>
                                        <span className="font-medium">{record?.plan.duration_days} días</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Límite de usuarios</span>
                                        <span className="font-medium">
                                            {record?.plan.user_limit ?? 'Ilimitado'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2 mt-2">
                                        <span className="text-muted-foreground">Enlace expira</span>
                                        <span className="font-medium text-amber-600">
                                            {record
                                                ? new Date(record.expires_at).toLocaleString('es-HN', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit',
                                                  })
                                                : '—'}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground text-center">
                                    Al confirmar, la suscripción anterior quedará inactiva y se creará una nueva con este plan.
                                </p>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => router.visit('/subscriptions')}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        disabled={confirming}
                                        onClick={handleActivate}
                                    >
                                        {confirming ? 'Activando…' : 'Activar licencia'}
                                    </Button>
                                </div>
                            </CardContent>
                        </>
                    )}
                </Card>
            </div>
        </>
    );
}

Activate.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: '/' },
        { title: 'Suscripciones', href: '/subscriptions' },
        { title: 'Activar licencia', href: '#' },
    ],
};
