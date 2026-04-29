import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { BadgeCheck, Ban, Key, ListFilter, Mail, Plus, RefreshCw, Search, Wrench, X } from 'lucide-react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Company {
    id: number;
    commercial_name: string;
    legal_name: string | null;
}

interface Plan {
    id: number;
    name: string;
    user_limit: number | null;
    duration_days: number;
}

interface Subscription {
    id: number;
    company: { commercial_name: string };
    plan: Plan;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
}

interface Token {
    id: number;
    company: { commercial_name: string };
    plan: { name: string };
    creator: { name: string };
    token: string;
    recipient_email: string;
    expires_at: string;
    used_at: string | null;
    status: 'pending' | 'used' | 'expired' | 'revoked';
}

interface Props {
    companies: Company[];
    plans: Plan[];
    subscriptions: Subscription[];
    tokens: Token[];
    dev_pin_enabled: boolean;
    flash?: { success?: string; error?: string };
    [key: string]: unknown;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
    return new Date(d).toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysLeft(endsAt: string) {
    const diff = Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000);
    return diff;
}

function StatusBadge({ status }: { status: Token['status'] }) {
    const map: Record<Token['status'], { label: string; className: string }> = {
        pending:  { label: 'Pendiente', className: 'bg-blue-100 text-blue-800' },
        used:     { label: 'Usado',     className: 'bg-green-100 text-green-800' },
        expired:  { label: 'Expirado',  className: 'bg-gray-100 text-gray-600' },
        revoked:  { label: 'Revocado',  className: 'bg-red-100 text-red-700' },
    };
    const { label, className } = map[status];
    return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>;
}

// ── Generate Token Dialog ──────────────────────────────────────────────────────

function GenerateTokenDialog({ companies, plans }: { companies: Company[]; plans: Plan[] }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        company_id:      '',
        plan_id:         '',
        recipient_email: '',
        expires_hours:   '48',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/subscriptions/generate-token', {
            onSuccess: () => { reset(); setOpen(false); },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-2 h-4 w-4" />Generar token</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Generar token de activación</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                        <Label>Empresa</Label>
                        <Select value={data.company_id} onValueChange={v => setData('company_id', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar empresa…" />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map(c => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.commercial_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.company_id && <p className="text-xs text-red-500">{errors.company_id}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Plan</Label>
                        <Select value={data.plan_id} onValueChange={v => setData('plan_id', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar plan…" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map(p => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                        {p.name} — {p.duration_days} días
                                        {p.user_limit ? ` / ${p.user_limit} usuarios` : ' / ilimitado'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.plan_id && <p className="text-xs text-red-500">{errors.plan_id}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Correo destino</Label>
                        <Input
                            type="email"
                            placeholder="cliente@empresa.com"
                            value={data.recipient_email}
                            onChange={e => setData('recipient_email', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            El enlace de activación se enviará a este correo.
                        </p>
                        {errors.recipient_email && <p className="text-xs text-red-500">{errors.recipient_email}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label>Validez del enlace (horas)</Label>
                        <Input
                            type="number"
                            min={1}
                            max={720}
                            value={data.expires_hours}
                            onChange={e => setData('expires_hours', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            El enlace expirará después de este tiempo. Default: 48 h.
                        </p>
                        {errors.expires_hours && <p className="text-xs text-red-500">{errors.expires_hours}</p>}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Enviando…' : 'Generar y enviar'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ── Dev PIN Card ───────────────────────────────────────────────────────────────

function DevPinCard({ companies, plans }: { companies: Company[]; plans: Plan[] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        pin:        '',
        company_id: '',
        plan_id:    '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/subscriptions/activate-pin', { onSuccess: () => reset() });
    }

    return (
        <Card className="border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-400">
                    <Wrench className="h-4 w-4" />
                    Activación por PIN — solo desarrollo
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-500 text-xs">
                    Esta sección no debe estar disponible en producción. Configura <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">DEV_LICENSE_PIN</code> en tu <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">.env</code>.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1">
                        <Label className="text-xs">Empresa</Label>
                        <Select value={data.company_id} onValueChange={v => setData('company_id', v)}>
                            <SelectTrigger className="w-44 h-8 text-xs">
                                <SelectValue placeholder="Empresa…" />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map(c => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.commercial_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Plan</Label>
                        <Select value={data.plan_id} onValueChange={v => setData('plan_id', v)}>
                            <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue placeholder="Plan…" />
                            </SelectTrigger>
                            <SelectContent>
                                {plans.map(p => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">PIN</Label>
                        <Input
                            type="password"
                            placeholder="••••••"
                            className="w-28 h-8 text-xs"
                            value={data.pin}
                            onChange={e => setData('pin', e.target.value)}
                        />
                    </div>
                    <Button type="submit" size="sm" disabled={processing} className="h-8 text-xs bg-amber-600 hover:bg-amber-700">
                        {processing ? 'Activando…' : 'Activar'}
                    </Button>
                    {errors.pin && <p className="w-full text-xs text-red-600">{errors.pin}</p>}
                </form>
            </CardContent>
        </Card>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SubscriptionsIndex() {
    const { companies, plans, subscriptions, tokens, dev_pin_enabled, flash } = usePage<Props>().props;

    const [search, setSearch]               = useState('');
    const [planFilter, setPlanFilter]       = useState('__all__');
    const [companyFilter, setCompanyFilter] = useState('__all__');

    function revokeToken(tokenId: number) {
        if (!confirm('¿Revocar este token?')) return;
        router.patch(`/subscriptions/tokens/${tokenId}/revoke`);
    }

    function deactivate(subId: number) {
        if (!confirm('¿Desactivar esta suscripción?')) return;
        router.patch(`/subscriptions/${subId}/deactivate`);
    }

    const filterFn = (item: any) => {
        const s = search.toLowerCase();
        const name = (item.company?.commercial_name || '').toLowerCase();
        const planName = (item.plan?.name || '').toLowerCase();
        const email = (item.recipient_email || '').toLowerCase();
        const creator = (item.creator?.name || '').toLowerCase();

        if (search && !name.includes(s) && !planName.includes(s) && !email.includes(s) && !creator.includes(s)) return false;
        if (planFilter !== '__all__' && String(item.plan?.id) !== planFilter) return false;
        if (companyFilter !== '__all__' && String(item.company?.id) !== companyFilter) return false;

        return true;
    };

    const filteredSubs   = subscriptions.filter(filterFn);
    const filteredTokens = tokens.filter(filterFn);

    return (
        <>
            <Head title="Suscripciones" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Flash */}
                {flash?.success && (
                    <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                        {flash.success}
                    </div>
                )}

                {/* Unified Header Card */}
                <Card>
                    <CardHeader className="py-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex w-full max-w-2xl items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar por empresa, plan, correo…"
                                        className="h-9 pl-9 pr-8 text-sm"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    {search && (
                                        <button
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => setSearch('')}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-9 gap-1.5 focus-visible:ring-0">
                                            <ListFilter className="h-4 w-4" />
                                            <span>Filtros</span>
                                            {(planFilter !== '__all__' || companyFilter !== '__all__') && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-0.5 h-4.5 rounded-full px-1.5 text-[10px] font-medium"
                                                >
                                                    {(planFilter !== '__all__' ? 1 : 0) + (companyFilter !== '__all__' ? 1 : 0)}
                                                </Badge>
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Plan
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={planFilter} onValueChange={setPlanFilter}>
                                            <DropdownMenuRadioItem value="__all__" className="text-sm">
                                                Todos los planes
                                            </DropdownMenuRadioItem>
                                            {plans.map(p => (
                                                <DropdownMenuRadioItem key={p.id} value={String(p.id)} className="text-sm">
                                                    {p.name}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>

                                        <DropdownMenuSeparator />

                                        <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            Empresa
                                        </DropdownMenuLabel>
                                        <DropdownMenuRadioGroup value={companyFilter} onValueChange={setCompanyFilter}>
                                            <DropdownMenuRadioItem value="__all__" className="text-sm">
                                                Todas las empresas
                                            </DropdownMenuRadioItem>
                                            {companies.map(c => (
                                                <DropdownMenuRadioItem key={c.id} value={String(c.id)} className="text-sm">
                                                    {c.commercial_name}
                                                </DropdownMenuRadioItem>
                                            ))}
                                        </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <GenerateTokenDialog companies={companies} plans={plans} />
                        </div>
                    </CardHeader>
                </Card>

                {/* Active Subscriptions Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BadgeCheck className="h-4 w-4 text-green-600" />
                            Suscripciones activas
                        </CardTitle>
                        <CardDescription>Licencias vigentes por empresa.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Empresa</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Inicio</TableHead>
                                    <TableHead>Vence</TableHead>
                                    <TableHead>Días restantes</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSubs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                            Sin suscripciones que coincidan con los filtros.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filteredSubs.map(sub => {
                                    const days = daysLeft(sub.ends_at);
                                    return (
                                        <TableRow key={sub.id}>
                                            <TableCell className="font-medium">{sub.company.commercial_name}</TableCell>
                                            <TableCell>{sub.plan.name}</TableCell>
                                            <TableCell>{fmtDate(sub.starts_at)}</TableCell>
                                            <TableCell>{fmtDate(sub.ends_at)}</TableCell>
                                            <TableCell>
                                                <span className={
                                                    days <= 0 ? 'text-red-600 font-semibold' :
                                                    days <= 10 ? 'text-amber-600 font-medium' :
                                                    'text-green-700'
                                                }>
                                                    {days <= 0 ? 'Vencida' : `${days} días`}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {sub.is_active && days > 0
                                                    ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activa</Badge>
                                                    : <Badge variant="secondary">Inactiva</Badge>}
                                            </TableCell>
                                            <TableCell>
                                                {sub.is_active && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-500 hover:text-red-700"
                                                        onClick={() => deactivate(sub.id)}
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Tokens History Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Key className="h-4 w-4 text-blue-600" />
                            Historial de tokens
                        </CardTitle>
                        <CardDescription>Últimos tokens de activación generados.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Empresa</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Correo destino</TableHead>
                                    <TableHead>Generado por</TableHead>
                                    <TableHead>Expira</TableHead>
                                    <TableHead>Usado</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTokens.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                            Sin tokens que coincidan con los filtros.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {filteredTokens.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium">{t.company.commercial_name}</TableCell>
                                        <TableCell>{t.plan.name}</TableCell>
                                        <TableCell className="text-muted-foreground text-xs">{t.recipient_email}</TableCell>
                                        <TableCell>{t.creator.name}</TableCell>
                                        <TableCell>{fmtDate(t.expires_at)}</TableCell>
                                        <TableCell>{t.used_at ? fmtDate(t.used_at) : '—'}</TableCell>
                                        <TableCell><StatusBadge status={t.status} /></TableCell>
                                        <TableCell>
                                            {t.status === 'pending' && (
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-blue-600 hover:text-blue-800"
                                                        onClick={() => router.post(`/subscriptions/tokens/${t.id}/resend`)}
                                                        title="Reenviar correo"
                                                    >
                                                        <Mail className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-amber-600 hover:text-amber-800"
                                                        onClick={() => revokeToken(t.id)}
                                                        title="Revocar token"
                                                    >
                                                        <RefreshCw className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Dev PIN */}
                {dev_pin_enabled && (
                    <DevPinCard companies={companies} plans={plans} />
                )}
            </div>
        </>
    );
}

SubscriptionsIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: '/' },
        { title: 'Suscripciones', href: '/subscriptions' },
    ],
};
