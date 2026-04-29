import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

interface ExistingTax {
    id: number; name: string; code: string; type: string; rate: string;
    tax_scope: string; active: boolean;
}

interface Props { tax?: ExistingTax }

export default function TaxForm({ tax }: Props) {
    const { props } = usePage<{ errors?: Record<string, string> }>();
    const errors = props.errors ?? {};
    const isEdit = Boolean(tax);

    const [name, setName]         = useState(tax?.name ?? '');
    const [code, setCode]         = useState(tax?.code ?? '');
    const [type, setType]         = useState(tax?.type ?? 'percentage');
    const [rate, setRate]         = useState(tax?.rate ?? '0');
    const [taxScope, setTaxScope] = useState(tax?.tax_scope ?? 'all');
    const [active, setActive]     = useState(tax?.active ?? true);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = { name, code, type, rate: Number(rate), tax_scope: taxScope, active };
        if (isEdit && tax) {
            router.patch(`/accounting/taxes/${tax.id}`, payload);
        } else {
            router.post('/accounting/taxes', payload);
        }
    }

    return (
        <>
            <Head title={isEdit ? `Editar ${tax!.name}` : 'Nuevo Impuesto'} />
            <form onSubmit={handleSubmit} className="flex h-full flex-1 flex-col gap-6 p-4 max-w-xl">
                <div className="flex items-center gap-3">
                    <Link href="/accounting/taxes">
                        <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                            <ArrowLeft className="h-4 w-4" /> Volver
                        </Button>
                    </Link>
                    <h1 className="text-lg font-semibold">{isEdit ? `Editar ${tax!.name}` : 'Nuevo Impuesto (ISV)'}</h1>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Configuración del Impuesto</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Nombre *</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ISV 15%" className="h-9" />
                            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Código *</Label>
                            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ISV15" className="h-9 font-mono" />
                            {errors.code && <p className="text-xs text-red-600">{errors.code}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Tipo *</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                                    <SelectItem value="fixed">Monto fijo (L.)</SelectItem>
                                    <SelectItem value="exempt">Exento</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">
                                {type === 'percentage' ? 'Tasa (%)' : type === 'fixed' ? 'Monto (L.)' : 'Tasa'}
                            </Label>
                            <Input type="number" min="0" max="100" step="0.01"
                                value={rate} onChange={(e) => setRate(e.target.value)}
                                disabled={type === 'exempt'} className="h-9 text-right font-mono" />
                            {errors.rate && <p className="text-xs text-red-600">{errors.rate}</p>}
                        </div>

                        <div className="space-y-1.5 col-span-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Aplica a</Label>
                            <Select value={taxScope} onValueChange={setTaxScope}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sales">Solo Ventas</SelectItem>
                                    <SelectItem value="purchases">Solo Compras</SelectItem>
                                    <SelectItem value="all">Ventas y Compras</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-3 col-span-2">
                            <Switch id="active" checked={active} onCheckedChange={setActive} />
                            <Label htmlFor="active" className="text-sm">Impuesto activo</Label>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Link href="/accounting/taxes">
                        <Button type="button" variant="outline" size="sm">Cancelar</Button>
                    </Link>
                    <Button type="submit" size="sm" className="bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-black">
                        {isEdit ? 'Guardar cambios' : 'Crear impuesto'}
                    </Button>
                </div>
            </form>
        </>
    );
}

TaxForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Impuestos', href: '/accounting/taxes' },
        { title: 'Impuesto', href: '#' },
    ],
};
