import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Edit, KeyRound } from 'lucide-react';

interface CaiConfig {
    id: number; cai: string; range_from: string; range_to: string;
    current_number: string | null; expires_at: string; active: boolean;
    journal: { id: number; name: string; code: string };
    establishment_code: string | null; terminal_code: string | null;
}

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('es-HN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function CaiConfigShow({ config }: { config: CaiConfig }) {
    const isExpired = new Date(config.expires_at) < new Date();
    const isValid   = config.active && !isExpired;

    return (
        <>
            <Head title={`CAI — ${config.cai.slice(0, 12)}…`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 max-w-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/accounting/cai">
                            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                                <ArrowLeft className="h-4 w-4" /> Volver
                            </Button>
                        </Link>
                        <h1 className="text-lg font-semibold flex items-center gap-2">
                            <KeyRound className="h-4 w-4" /> CAI
                        </h1>
                        <Badge className={`text-[10px] border ${isValid ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'}`}>
                            {!config.active ? 'Inactivo' : isExpired ? 'Vencido' : 'Vigente'}
                        </Badge>
                    </div>
                    <Link href={`/accounting/cai/${config.id}/edit`}>
                        <Button variant="outline" size="sm" className="gap-1.5 h-8">
                            <Edit className="h-3.5 w-3.5" /> Editar
                        </Button>
                    </Link>
                </div>

                {isExpired && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        Este CAI venció el {fmtDate(config.expires_at)}. No se pueden emitir facturas con este CAI.
                    </div>
                )}

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Datos del CAI</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Clave CAI</dt>
                                <dd className="mt-1 font-mono text-sm break-all">{config.cai}</dd>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Rango autorizado</dt>
                                    <dd className="mt-1 font-mono text-sm">{config.range_from} — {config.range_to}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Correlativo actual</dt>
                                    <dd className="mt-1 font-mono text-sm">{config.current_number ?? '— (no iniciado)'}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Fecha de vencimiento</dt>
                                    <dd className={`mt-1 text-sm font-semibold ${isExpired ? 'text-red-600' : ''}`}>{fmtDate(config.expires_at)}</dd>
                                </div>
                                <div>
                                    <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Diario</dt>
                                    <dd className="mt-1 text-sm">{config.journal.name}</dd>
                                </div>
                                {config.establishment_code && (
                                    <div>
                                        <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Código de establecimiento</dt>
                                        <dd className="mt-1 font-mono text-sm">{config.establishment_code}</dd>
                                    </div>
                                )}
                                {config.terminal_code && (
                                    <div>
                                        <dt className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Punto de emisión</dt>
                                        <dd className="mt-1 font-mono text-sm">{config.terminal_code}</dd>
                                    </div>
                                )}
                            </div>
                        </dl>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CaiConfigShow.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'CAI', href: '/accounting/cai' },
        { title: 'Detalle', href: '#' },
    ],
};
