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
interface AccountOption { id: number; code: string; name: string }

interface ExistingAnalyticalAccount {
    id: number; code: string; name: string; description: string | null;
    account_id: number | null; parent_id: number | null; active: boolean;
}

interface Props {
    analyticalAccount?: ExistingAnalyticalAccount;
    parents: ParentOption[];
    accounts: AccountOption[];
}

export default function AnalyticalAccountForm({ analyticalAccount, parents, accounts }: Props) {
    const { props } = usePage<{ errors?: Record<string, string> }>();
    const errors = props.errors ?? {};
    const isEdit = Boolean(analyticalAccount);

    const [code, setCode]           = useState(analyticalAccount?.code ?? '');
    const [name, setName]           = useState(analyticalAccount?.name ?? '');
    const [description, setDescription] = useState(analyticalAccount?.description ?? '');
    const [accountId, setAccountId] = useState(analyticalAccount?.account_id ? String(analyticalAccount.account_id) : 'none');
    const [parentId, setParentId]   = useState(analyticalAccount?.parent_id ? String(analyticalAccount.parent_id) : 'none');
    const [active, setActive]       = useState(analyticalAccount?.active ?? true);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            code, name,
            description: description || null,
            account_id: accountId && accountId !== "none" ? Number(accountId) : null,
            parent_id: parentId && parentId !== "none" ? Number(parentId) : null,
            active,
        };

        if (isEdit && analyticalAccount) {
            router.patch(`/accounting/analytical-accounts/${analyticalAccount.id}`, payload);
        } else {
            router.post('/accounting/analytical-accounts', payload);
        }
    }

    return (
        <>
            <Head title={isEdit ? `Editar ${analyticalAccount!.code}` : 'Nueva Cuenta Analítica'} />
            <form onSubmit={handleSubmit} className="flex h-full flex-1 flex-col gap-6 p-4 max-w-2xl">
                <div className="flex items-center gap-3">
                    <Link href="/accounting/analytical-accounts">
                        <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                            <ArrowLeft className="h-4 w-4" /> Volver
                        </Button>
                    </Link>
                    <h1 className="text-lg font-semibold">{isEdit ? `Editar ${analyticalAccount!.code}` : 'Nueva Cuenta Analítica'}</h1>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Datos de la Cuenta Analítica</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Código *</Label>
                            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="AA-001" className="h-9 font-mono" />
                            {errors.code && <p className="text-xs text-red-600">{errors.code}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Nombre *</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ventas por sucursal" className="h-9" />
                            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Cuenta Contable</Label>
                            <Select value={accountId} onValueChange={setAccountId}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="— ninguna —" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">— ninguna —</SelectItem>
                                    {accounts.map((a) => (
                                        <SelectItem key={a.id} value={String(a.id)} className="text-xs">
                                            <span className="font-mono mr-2 text-muted-foreground">{a.code}</span>{a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Cuenta Analítica Padre</Label>
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
                    <Link href="/accounting/analytical-accounts">
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

AnalyticalAccountForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Cuentas Analíticas', href: '/accounting/analytical-accounts' },
        { title: 'Cuenta Analítica', href: '#' },
    ],
};
