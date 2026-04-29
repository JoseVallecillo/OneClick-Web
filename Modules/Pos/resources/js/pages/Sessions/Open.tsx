import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { dashboard } from '@/routes';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, MonitorCheck } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Warehouse { id: number; name: string }
interface Currency  { id: number; code: string; symbol: string; name: string }

interface Props {
    warehouses: Warehouse[];
    currencies: Currency[];
    primaryCurrency: { id: number; code: string; symbol: string } | null;
    users: { id: number; name: string }[];
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SessionOpen({ warehouses, currencies, primaryCurrency, users }: Props) {
    const { auth } = usePage<{ auth: { user: { id: number } } }>().props;

    const { data, setData, post, processing, errors } = useForm({
        name:            '',
        warehouse_id:    '',
        currency_id:     String(primaryCurrency?.id ?? ''),
        opening_balance: '0',
        notes:           '',
        user_id:         String(auth.user.id),
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/pos/sessions');
    }

    return (
        <>
            <Head title="Abrir Caja" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 max-w-2xl">
                {/* Back + title */}
                <div className="flex items-center gap-3">
                    <Link href="/pos/sessions">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            Sesiones
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <MonitorCheck className="h-5 w-5 text-green-600" />
                        Abrir Nueva Caja
                    </h1>
                </div>

                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                    Al abrir una sesión de caja podrás registrar ventas inmediatas B2C. El saldo inicial corresponde al efectivo físico en el cajón al momento de apertura.
                </div>

                <form onSubmit={submit} className="flex flex-col gap-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Datos de la sesión</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            {/* Session name */}
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label>Nombre de la caja (opcional)</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ej: Caja Principal, Caja 1 - Turno Mañana"
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>

                            {/* Warehouse */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Almacén de despacho <span className="text-destructive">*</span></Label>
                                <Select value={data.warehouse_id} onValueChange={(v) => setData('warehouse_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar almacén…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map((w) => (
                                            <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.warehouse_id && <p className="text-xs text-destructive">{errors.warehouse_id}</p>}
                            </div>

                            {/* Currency */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Moneda <span className="text-destructive">*</span></Label>
                                <Select value={data.currency_id} onValueChange={(v) => setData('currency_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar moneda…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.code} — {c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.currency_id && <p className="text-xs text-destructive">{errors.currency_id}</p>}
                            </div>

                            {/* User / Cashier */}
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label>Cajero / Responsable <span className="text-destructive">*</span></Label>
                                <Select value={data.user_id} onValueChange={(v) => setData('user_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar usuario…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((u) => (
                                            <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">La persona que va a operar y será responsable del dinero de esta caja.</p>
                                {errors.user_id && <p className="text-xs text-destructive">{errors.user_id}</p>}
                            </div>

                            {/* Opening balance */}
                            <div className="flex flex-col gap-1.5">
                                <Label>Saldo inicial en efectivo <span className="text-destructive">*</span></Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.opening_balance}
                                    onChange={(e) => setData('opening_balance', e.target.value)}
                                    className="tabular-nums"
                                />
                                <p className="text-xs text-muted-foreground">Efectivo físico en el cajón al abrir.</p>
                                {errors.opening_balance && <p className="text-xs text-destructive">{errors.opening_balance}</p>}
                            </div>

                            {/* Notes */}
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                                <Label>Notas</Label>
                                <Textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={2}
                                    placeholder="Observaciones de apertura…"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.visit('/pos/sessions')}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing} className="flex items-center gap-1.5">
                            <MonitorCheck className="h-4 w-4" />
                            Abrir caja e ir al terminal
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

SessionOpen.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Punto de Venta', href: '/pos/sessions' },
        { title: 'Abrir caja', href: '#' },
    ],
};
