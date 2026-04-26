import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CheckCircle, MapPin, MessageCircle, Phone, X, XCircle } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Microfinanzas', href: '/microfinance' },
    { title: 'Ruta de cobro', href: '#' },
];

const fmt = (n: any) => Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Stop {
    id: number; sort_order: number; status: string; amount_due: number; days_overdue: number;
    collected_amount: number; notes?: string; visited_at?: string;
    latitude?: number; longitude?: number;
    client: { id: number; first_name: string; last_name: string; phone_mobile?: string; phone_whatsapp?: string; address?: string };
    loan: { id: number; loan_number: string; product: { name: string }; payment_frequency: string };
}
interface Route { id: number; route_date: string; status: string; total_stops: number; visited_stops: number; expected_amount: number; collected_amount: number; stops: Stop[] }
interface Props { route: Route; date: string }

export default function CollectionRoute({ route, date }: Props) {
    const [active, setActive] = useState<Stop | null>(null);
    const [amount, setAmount]   = useState('');
    const [resultStatus, setResultStatus] = useState('collected');
    const [notes, setNotes]     = useState('');

    const pendingStops    = route.stops.filter(s => s.status === 'pending');
    const completedStops  = route.stops.filter(s => s.status !== 'pending');
    const collectionPct   = route.expected_amount > 0 ? (route.collected_amount / route.expected_amount * 100).toFixed(1) : '0.0';

    const openStop = (stop: Stop) => {
        setActive(stop);
        setAmount(String(stop.amount_due));
        setResultStatus('collected');
        setNotes('');
    };

    const submitStop = () => {
        if (!active) return;
        router.patch(`/microfinance/collection/stops/${active.id}`, {
            status: resultStatus,
            collected_amount: resultStatus === 'promise' ? 0 : amount,
            notes,
        }, { onSuccess: () => { setActive(null); } });
    };

    const openMap = (stop: Stop) => {
        if (stop.latitude && stop.longitude) {
            window.open(`https://maps.google.com/maps?q=${stop.latitude},${stop.longitude}`, '_blank');
        } else if (stop.client.address) {
            window.open(`https://maps.google.com/maps?q=${encodeURIComponent(stop.client.address)}`, '_blank');
        }
    };

    return (
        <>
            <Head title="Ruta de Cobro" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="md:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xl">Ruta del día - {new Date(date + 'T12:00:00').toLocaleDateString('es-HN', { weekday: 'long', day: 'numeric', month: 'long' })}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">Progreso de cobro</span>
                                <span className="font-bold text-primary">{collectionPct}%</span>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                                <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${collectionPct}%` }} />
                            </div>
                            <div className="mt-3 flex justify-between text-xs font-medium text-muted-foreground">
                                <span>{route.visited_stops} visitados</span>
                                <span>{route.total_stops - route.visited_stops} pendientes</span>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xl text-center">Recaudación</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-3xl font-black text-primary">L.{fmt(route.collected_amount)}</p>
                            <p className="text-sm font-medium text-muted-foreground mt-1">de L.{fmt(route.expected_amount)} esperados</p>
                        </CardContent>
                    </Card>
                </div>

                {pendingStops.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Paradas Pendientes
                                <Badge variant="secondary">{pendingStops.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {pendingStops.map((stop) => (
                                    <div key={stop.id} className="flex flex-col gap-4 rounded-xl border bg-card text-card-foreground shadow-sm p-5 transition-colors hover:bg-muted/50">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <h3 className="font-semibold">{stop.client.first_name} {stop.client.last_name}</h3>
                                                <p className="text-sm text-muted-foreground">{stop.loan.loan_number}</p>
                                                {stop.days_overdue > 0 && (
                                                    <Badge variant="destructive" className="mt-1">+{stop.days_overdue} días mora</Badge>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">A cobrar</p>
                                                <p className="font-bold text-lg">L.{fmt(stop.amount_due)}</p>
                                            </div>
                                        </div>
                                        
                                        {stop.client.address && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <MapPin className="h-3 w-3 shrink-0" />
                                                <span className="line-clamp-2">{stop.client.address}</span>
                                            </p>
                                        )}

                                        <div className="mt-auto flex items-center gap-2 pt-2">
                                            <Button className="flex-1" onClick={() => openStop(stop)}>
                                                Registrar Cobro
                                            </Button>
                                            <Button variant="outline" size="icon" onClick={() => openMap(stop)}>
                                                <MapPin className="h-4 w-4" />
                                            </Button>
                                            {stop.client.phone_mobile && (
                                                <Button variant="outline" size="icon" asChild>
                                                    <a href={`tel:${stop.client.phone_mobile}`}><Phone className="h-4 w-4" /></a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {completedStops.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Paradas Completadas
                                <Badge variant="secondary">{completedStops.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 font-medium">Estado</th>
                                            <th className="pb-2 font-medium">Cliente</th>
                                            <th className="pb-2 font-medium">Notas</th>
                                            <th className="pb-2 font-medium text-right">Cobrado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {completedStops.map(stop => (
                                            <tr key={stop.id} className="group">
                                                <td className="py-3 pr-4">
                                                    {stop.status === 'collected' ? <Badge className="bg-emerald-500 hover:bg-emerald-600">Cobrado</Badge> : 
                                                     stop.status === 'promise' ? <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">Promesa</Badge> : 
                                                     stop.status === 'not_found' ? <Badge variant="outline">No enc.</Badge> : 
                                                     <Badge className="bg-indigo-500 hover:bg-indigo-600">Parcial</Badge>}
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <p className="font-medium">{stop.client.first_name} {stop.client.last_name}</p>
                                                    <p className="text-xs text-muted-foreground">{stop.loan.loan_number}</p>
                                                </td>
                                                <td className="py-3 pr-4 text-xs text-muted-foreground max-w-[200px] truncate">
                                                    {stop.notes || '—'}
                                                </td>
                                                <td className="py-3 text-right font-medium">
                                                    {stop.collected_amount > 0 ? `L.${fmt(stop.collected_amount)}` : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {route.stops.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <CheckCircle className="h-12 w-12 mb-4 opacity-50" />
                            <p className="font-semibold text-lg">Al día</p>
                            <p className="text-sm">No hay cobros programados para hoy</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Stop action modal */}
            {active && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-md shadow-lg">
                        <CardHeader className="flex flex-row items-start justify-between pb-4 border-b">
                            <div>
                                <CardTitle>{active.client.first_name} {active.client.last_name}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">{active.loan.loan_number} · Cuota: L.{fmt(active.amount_due)}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setActive(null)} className="h-6 w-6 rounded-full">
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 gap-2 mb-6">
                                {[['collected','Cobro Total'], ['partial','Cobro Parcial'], ['promise','Promesa'], ['not_found','No Encontrado']].map(([val, label]) => (
                                    <Button 
                                        key={val} 
                                        type="button" 
                                        variant={resultStatus === val ? 'default' : 'outline'}
                                        onClick={() => setResultStatus(val)}
                                        className="w-full"
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </div>

                            {resultStatus !== 'not_found' && resultStatus !== 'promise' && (
                                <div className="space-y-2 mb-6">
                                    <Label>Monto cobrado (L.)</Label>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        value={amount} 
                                        onChange={e => setAmount(e.target.value)}
                                        className="text-lg font-bold"
                                    />
                                </div>
                            )}

                            <div className="space-y-2 mb-6">
                                <Label>Notas u observaciones</Label>
                                <Textarea 
                                    value={notes} 
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Escribe un comentario opcional..." 
                                    className="resize-none"
                                />
                            </div>

                            <Button onClick={submitStop} className="w-full font-semibold">
                                Confirmar Registro
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    );
}

CollectionRoute.layout = { breadcrumbs };
