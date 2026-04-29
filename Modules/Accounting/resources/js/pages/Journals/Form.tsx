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

interface AccountOption  { id: number; code: string; name: string }
interface ExistingJournal {
    id: number; name: string; code: string; type: string;
    default_debit_account_id: number | null; default_credit_account_id: number | null;
    bank_account_number: string | null; active: boolean;
}
interface Props { journal?: ExistingJournal; accounts: AccountOption[] }

export default function JournalForm({ journal, accounts }: Props) {
    const { props } = usePage<{ errors?: Record<string, string> }>();
    const errors = props.errors ?? {};
    const isEdit = Boolean(journal);

    const [name, setName]                             = useState(journal?.name ?? '');
    const [code, setCode]                             = useState(journal?.code ?? '');
    const [type, setType]                             = useState(journal?.type ?? '');
    const [debitAccountId, setDebitAccountId]         = useState(journal?.default_debit_account_id ? String(journal.default_debit_account_id) : 'none');
    const [creditAccountId, setCreditAccountId]       = useState(journal?.default_credit_account_id ? String(journal.default_credit_account_id) : 'none');
    const [bankAccountNumber, setBankAccountNumber]   = useState(journal?.bank_account_number ?? '');
    const [active, setActive]                         = useState(journal?.active ?? true);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            name, code, type,
            default_debit_account_id:  debitAccountId && debitAccountId !== "none" ? Number(debitAccountId)  : null,
            default_credit_account_id: creditAccountId && creditAccountId !== "none" ? Number(creditAccountId) : null,
            bank_account_number: bankAccountNumber || null,
            active,
        };
        if (isEdit && journal) {
            router.patch(`/accounting/journals/${journal.id}`, payload);
        } else {
            router.post('/accounting/journals', payload);
        }
    }

    return (
        <>
            <Head title={isEdit ? `Editar ${journal!.name}` : 'Nuevo Diario'} />
            <form onSubmit={handleSubmit} className="flex h-full flex-1 flex-col gap-6 p-4 max-w-2xl">
                <div className="flex items-center gap-3">
                    <Link href="/accounting/journals">
                        <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                            <ArrowLeft className="h-4 w-4" /> Volver
                        </Button>
                    </Link>
                    <h1 className="text-lg font-semibold">{isEdit ? `Editar ${journal!.name}` : 'Nuevo Diario'}</h1>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Configuración del Diario</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Nombre *</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Diario de Ventas" className="h-9" />
                            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Código *</Label>
                            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="VJ" className="h-9 font-mono" />
                            {errors.code && <p className="text-xs text-red-600">{errors.code}</p>}
                        </div>

                        <div className="space-y-1.5 col-span-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Tipo *</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Tipo de diario…" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sales">Ventas</SelectItem>
                                    <SelectItem value="purchases">Compras</SelectItem>
                                    <SelectItem value="bank">Banco</SelectItem>
                                    <SelectItem value="cash">Caja</SelectItem>
                                    <SelectItem value="general">Varios / Ajustes</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.type && <p className="text-xs text-red-600">{errors.type}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Cuenta Débito por Defecto</Label>
                            <Select value={debitAccountId} onValueChange={setDebitAccountId}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="— ninguna —" /></SelectTrigger>
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
                            <Label className="text-xs font-semibold uppercase tracking-wider">Cuenta Crédito por Defecto</Label>
                            <Select value={creditAccountId} onValueChange={setCreditAccountId}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="— ninguna —" /></SelectTrigger>
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

                        {(type === 'bank' || type === 'cash') && (
                            <div className="space-y-1.5 col-span-2">
                                <Label className="text-xs font-semibold uppercase tracking-wider">Número de cuenta bancaria</Label>
                                <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)}
                                    placeholder="01-101-XXXXXXXX" className="h-9 font-mono" />
                            </div>
                        )}

                        <div className="flex items-center gap-3 col-span-2">
                            <Switch id="active" checked={active} onCheckedChange={setActive} />
                            <Label htmlFor="active" className="text-sm">Diario activo</Label>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Link href="/accounting/journals">
                        <Button type="button" variant="outline" size="sm">Cancelar</Button>
                    </Link>
                    <Button type="submit" size="sm" className="bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-black">
                        {isEdit ? 'Guardar cambios' : 'Crear diario'}
                    </Button>
                </div>
            </form>
        </>
    );
}

JournalForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Diarios', href: '/accounting/journals' },
        { title: 'Diario', href: '#' },
    ],
};
