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

interface ParentOption { id: number; code: string; name: string }
interface TaxOption    { id: number; name: string; code: string }

interface ExistingAccount {
    id: number; code: string; name: string; description: string | null;
    type: string; normal_balance: string; parent_id: number | null;
    tax_id: number | null; active: boolean;
}

interface Props {
    account?: ExistingAccount;
    parents: ParentOption[];
    taxes: TaxOption[];
}

export default function AccountForm({ account, parents, taxes }: Props) {
    const { props } = usePage<{ errors?: Record<string, string> }>();
    const errors = props.errors ?? {};
    const isEdit = Boolean(account);

    const [code, setCode]                 = useState(account?.code ?? '');
    const [name, setName]                 = useState(account?.name ?? '');
    const [description, setDescription]   = useState(account?.description ?? '');
    const [type, setType]                 = useState(account?.type ?? '');
    const [normalBalance, setNormalBalance] = useState(account?.normal_balance ?? '');
    const [parentId, setParentId]         = useState(account?.parent_id ? String(account.parent_id) : 'none');
    const [taxId, setTaxId]               = useState(account?.tax_id ? String(account.tax_id) : 'none');
    const [active, setActive]             = useState(account?.active ?? true);

    // Auto-suggest normal balance from type
    function handleTypeChange(t: string) {
        setType(t);
        if (!normalBalance) {
            setNormalBalance(t === 'asset' || t === 'expense' ? 'debit' : 'credit');
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            code, name,
            description: description || null,
            type, normal_balance: normalBalance,
            parent_id: parentId && parentId !== "none" ? Number(parentId) : null,
            tax_id: taxId && taxId !== "none" ? Number(taxId) : null,
            active,
        };

        if (isEdit && account) {
            router.patch(`/accounting/accounts/${account.id}`, payload);
        } else {
            router.post('/accounting/accounts', payload);
        }
    }

    return (
        <>
            <Head title={isEdit ? `Editar ${account!.code}` : 'Nueva Cuenta'} />
            <form onSubmit={handleSubmit} className="flex h-full flex-1 flex-col gap-6 p-4 max-w-2xl">
                <div className="flex items-center gap-3">
                    <Link href="/accounting/accounts">
                        <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                            <ArrowLeft className="h-4 w-4" /> Volver
                        </Button>
                    </Link>
                    <h1 className="text-lg font-semibold">{isEdit ? `Editar ${account!.code}` : 'Nueva Cuenta Contable'}</h1>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Datos de la Cuenta</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Código *</Label>
                            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="1101" className="h-9 font-mono" />
                            {errors.code && <p className="text-xs text-red-600">{errors.code}</p>}
                        </div>

                        <div className="space-y-1.5 col-span-1">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Nombre *</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Efectivo en caja" className="h-9" />
                            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Tipo *</Label>
                            <Select value={type} onValueChange={handleTypeChange}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Tipo de cuenta…" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="asset">Activo</SelectItem>
                                    <SelectItem value="liability">Pasivo</SelectItem>
                                    <SelectItem value="equity">Patrimonio</SelectItem>
                                    <SelectItem value="income">Ingreso</SelectItem>
                                    <SelectItem value="expense">Gasto</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.type && <p className="text-xs text-red-600">{errors.type}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Saldo Normal *</Label>
                            <Select value={normalBalance} onValueChange={setNormalBalance}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Debe / Haber…" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="debit">Débito (Debe)</SelectItem>
                                    <SelectItem value="credit">Crédito (Haber)</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.normal_balance && <p className="text-xs text-red-600">{errors.normal_balance}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Cuenta Padre</Label>
                            <Select value={parentId} onValueChange={setParentId}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="— ninguna —" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">— ninguna —</SelectItem>
                                    {parents.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                                            <span className="font-mono mr-2 text-muted-foreground">{p.code}</span>{p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Impuesto (ISV)</Label>
                            <Select value={taxId} onValueChange={setTaxId}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="— ninguno —" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">— ninguno —</SelectItem>
                                    {taxes.map((t) => (
                                        <SelectItem key={t.id} value={String(t.id)} className="text-xs">
                                            <span className="font-mono mr-2 text-muted-foreground">{t.code}</span>{t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5 col-span-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Descripción</Label>
                            <Input value={description} onChange={(e) => setDescription(e.target.value)}
                                placeholder="Descripción opcional…" className="h-9" />
                        </div>

                        <div className="flex items-center gap-3 col-span-2">
                            <Switch id="active" checked={active} onCheckedChange={setActive} />
                            <Label htmlFor="active" className="text-sm">Cuenta activa</Label>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Link href="/accounting/accounts">
                        <Button type="button" variant="outline" size="sm">Cancelar</Button>
                    </Link>
                    <Button type="submit" size="sm" className="bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-black">
                        {isEdit ? 'Guardar cambios' : 'Crear cuenta'}
                    </Button>
                </div>
            </form>
        </>
    );
}

AccountForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Catálogo de Cuentas', href: '/accounting/accounts' },
        { title: 'Cuenta', href: '#' },
    ],
};
