import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface ExistingCurrency {
    id: number;
    code: string;
    name: string;
    symbol: string;
    exchange_rate: string;
    is_primary: boolean;
    active: boolean;
}

interface Props { currency?: ExistingCurrency }

export default function CurrencyForm({ currency }: Props) {
    const { props } = usePage<{ errors?: Record<string, string> }>();
    const errors = props.errors ?? {};
    const isEdit = Boolean(currency);

    const [code, setCode]               = useState(currency?.code ?? '');
    const [name, setName]               = useState(currency?.name ?? '');
    const [symbol, setSymbol]           = useState(currency?.symbol ?? '');
    const [exchangeRate, setExchangeRate] = useState(currency?.exchange_rate ?? '1');
    const [isPrimary, setIsPrimary]     = useState(currency?.is_primary ?? false);
    const [active, setActive]           = useState(currency?.active ?? true);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = { code, name, symbol, exchange_rate: Number(exchangeRate), is_primary: isPrimary, active };
        if (isEdit && currency) {
            router.patch(`/accounting/currencies/${currency.id}`, payload);
        } else {
            router.post('/accounting/currencies', payload);
        }
    }

    return (
        <>
            <Head title={isEdit ? `Editar ${currency!.name}` : 'Nueva Moneda'} />
            <form onSubmit={handleSubmit} className="flex h-full flex-1 flex-col gap-6 p-4 max-w-xl">
                <div className="flex items-center gap-3">
                    <Link href="/accounting/currencies">
                        <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                            <ArrowLeft className="h-4 w-4" /> Volver
                        </Button>
                    </Link>
                    <h1 className="text-lg font-semibold">{isEdit ? `Editar ${currency!.name}` : 'Nueva Moneda'}</h1>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Configuración de Moneda</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Código *</Label>
                            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="HNL" className="h-9 font-mono uppercase" maxLength={10} />
                            {errors.code && <p className="text-xs text-red-600">{errors.code}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Nombre *</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)}
                                placeholder="Lempira" className="h-9" />
                            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Símbolo *</Label>
                            <Input value={symbol} onChange={(e) => setSymbol(e.target.value)}
                                placeholder="L" className="h-9 font-mono w-24" maxLength={10} />
                            {errors.symbol && <p className="text-xs text-red-600">{errors.symbol}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Tasa de cambio *</Label>
                            <Input type="number" step="0.000001" min="0.000001"
                                value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)}
                                disabled={isPrimary} className="h-9 font-mono text-right" />
                            <p className="text-xs text-muted-foreground">Relativa a la moneda principal</p>
                            {errors.exchange_rate && <p className="text-xs text-red-600">{errors.exchange_rate}</p>}
                        </div>

                        <div className="flex items-center gap-3 col-span-2">
                            <Switch id="is_primary" checked={isPrimary}
                                onCheckedChange={(v) => { setIsPrimary(v); if (v) setExchangeRate('1'); }} />
                            <Label htmlFor="is_primary" className="text-sm">Moneda principal</Label>
                        </div>

                        <div className="flex items-center gap-3 col-span-2">
                            <Switch id="active" checked={active} onCheckedChange={setActive} />
                            <Label htmlFor="active" className="text-sm">Moneda activa</Label>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Link href="/accounting/currencies">
                        <Button type="button" variant="outline" size="sm">Cancelar</Button>
                    </Link>
                    <Button type="submit" size="sm" className="bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-black">
                        {isEdit ? 'Guardar cambios' : 'Crear moneda'}
                    </Button>
                </div>
            </form>
        </>
    );
}

CurrencyForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Monedas', href: '/accounting/currencies' },
        { title: 'Moneda', href: '#' },
    ],
};
