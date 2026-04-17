import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Building2, Globe, Lock, Mail, Settings, Users } from 'lucide-react';
import { useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Company {
    id: number;
    commercial_name: string;
    legal_name: string | null;
    tax_id: string | null;
    legal_representative: string | null;
    logo_light: string | null;
    logo_dark: string | null;
    logo_pdf: string | null;
    currency: string;
    timezone: string;
    date_format: string;
    branches: BranchRow[];
}

interface BranchRow {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    active: boolean;
    users_count: number;
}

interface UserOption {
    id: number;
    name: string;
    email: string;
}

interface TaxRateRow {
    id: number;
    name: string;
    rate: string;       // decimal from PHP comes as string
    is_default: boolean;
    active: boolean;
}

interface CurrencyRow {
    id: number;
    code: string;
    name: string;
    symbol: string;
    exchange_rate: string;
    is_primary: boolean;
    active: boolean;
}

interface SmtpSettings {
    host: string;
    port: number;
    username: string;
    encryption: string;
    from_address: string;
    from_name: string;
}

interface Props {
    company: Company | null;
    users: UserOption[];
    currencies: CurrencyRow[];
    tax_rates: TaxRateRow[];
    smtp: SmtpSettings;
    smtp_configured: boolean;
}

// ── Tab button ─────────────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon: Icon, children, className = '' }: {
    active: boolean;
    onClick: () => void;
    icon: React.ElementType;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 border-b-2 px-4 pb-3 text-sm font-medium transition-colors ${
                active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
            } ${className}`}
        >
            <Icon className="h-4 w-4" />
            {children}
        </button>
    );
}

// ── Logo upload field ──────────────────────────────────────────────────────────

function LogoField({ label, description, field, currentPath, onChange }: {
    label: string;
    description: string;
    field: string;
    currentPath: string | null;
    onChange: (file: File) => void;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(
        currentPath ? `/storage/${currentPath}` : null,
    );

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setPreview(URL.createObjectURL(file));
        onChange(file);
    }

    return (
        <div className="flex flex-col gap-1.5">
            <Label>{label}</Label>
            <p className="text-xs text-muted-foreground">{description}</p>
            <div
                className="flex cursor-pointer items-center gap-4 rounded-lg border border-dashed p-3 transition-colors hover:bg-muted/40"
                onClick={() => ref.current?.click()}
            >
                {preview ? (
                    <img src={preview} alt={label} className="h-12 w-auto max-w-[120px] object-contain" />
                ) : (
                    <div className="flex h-12 w-24 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        Sin logo
                    </div>
                )}
                <span className="text-xs text-muted-foreground">Haz clic para cambiar (PNG, JPG, SVG)</span>
            </div>
            <input ref={ref} type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden" onChange={handleChange} />
        </div>
    );
}

// ── Branch users dialog ────────────────────────────────────────────────────────

function BranchUsersDialog({ branch, allUsers }: { branch: BranchRow; allUsers: UserOption[] }) {
    const [open, setOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);

    function onOpenChange(val: boolean) {
        setOpen(val);
        if (val && !loaded) {
            // Load current users for this branch
            router.reload({
                only: [],
                onSuccess: () => setLoaded(true),
            });
        }
    }

    function toggle(id: number) {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    }

    function save() {
        setSaving(true);
        router.patch(
            `/settings/branches/${branch.id}/users`,
            { user_ids: selectedIds },
            { onFinish: () => { setSaving(false); setOpen(false); } },
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <Badge variant="secondary" className="text-[10px]">{branch.users_count}</Badge>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Usuarios — {branch.name}</DialogTitle>
                </DialogHeader>
                <div className="flex max-h-72 flex-col gap-2 overflow-y-auto py-2">
                    {allUsers.map((user) => (
                        <label key={user.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-muted">
                            <Checkbox
                                checked={selectedIds.includes(user.id)}
                                onCheckedChange={() => toggle(user.id)}
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{user.name}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                        </label>
                    ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={save} disabled={saving}>
                        {saving ? <><Spinner className="mr-1" />Guardando…</> : 'Guardar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Tab: Empresa ───────────────────────────────────────────────────────────────

function TabEmpresa({ company }: { company: Company | null }) {
    const { data, setData, post, processing, errors } = useForm({
        commercial_name:     company?.commercial_name ?? '',
        legal_name:          company?.legal_name ?? '',
        tax_id:              company?.tax_id ?? '',
        legal_representative: company?.legal_representative ?? '',
        currency:            company?.currency ?? 'HNL',
        timezone:            company?.timezone ?? 'America/Tegucigalpa',
        date_format:         company?.date_format ?? 'd/m/Y',
        logo_light:          null as File | null,
        logo_dark:           null as File | null,
        logo_pdf:            null as File | null,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/settings/company', { forceFormData: true });
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-6">
            {/* Datos legales */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="commercial_name">Nombre comercial *</Label>
                    <Input id="commercial_name" value={data.commercial_name}
                        onChange={(e) => setData('commercial_name', e.target.value)} />
                    {errors.commercial_name && <p className="text-xs text-destructive">{errors.commercial_name}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="legal_name">Razón social</Label>
                    <Input id="legal_name" value={data.legal_name}
                        onChange={(e) => setData('legal_name', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="tax_id">RTN / NIT</Label>
                    <Input id="tax_id" value={data.tax_id}
                        onChange={(e) => setData('tax_id', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="legal_representative">Representante legal</Label>
                    <Input id="legal_representative" value={data.legal_representative}
                        onChange={(e) => setData('legal_representative', e.target.value)} />
                </div>
            </div>

            {/* Localización */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="currency">Moneda</Label>
                    <Select value={data.currency} onValueChange={(v) => setData('currency', v)}>
                        <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="HNL">HNL — Lempira</SelectItem>
                            <SelectItem value="USD">USD — Dólar</SelectItem>
                            <SelectItem value="EUR">EUR — Euro</SelectItem>
                            <SelectItem value="GTQ">GTQ — Quetzal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="timezone">Zona horaria</Label>
                    <Select value={data.timezone} onValueChange={(v) => setData('timezone', v)}>
                        <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="America/Tegucigalpa">Tegucigalpa (UTC-6)</SelectItem>
                            <SelectItem value="America/Guatemala">Guatemala (UTC-6)</SelectItem>
                            <SelectItem value="America/El_Salvador">El Salvador (UTC-6)</SelectItem>
                            <SelectItem value="America/Managua">Managua (UTC-6)</SelectItem>
                            <SelectItem value="America/Costa_Rica">Costa Rica (UTC-6)</SelectItem>
                            <SelectItem value="America/Panama">Panamá (UTC-5)</SelectItem>
                            <SelectItem value="America/Bogota">Bogotá (UTC-5)</SelectItem>
                            <SelectItem value="America/New_York">New York (UTC-5)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="date_format">Formato de fecha</Label>
                    <Select value={data.date_format} onValueChange={(v) => setData('date_format', v)}>
                        <SelectTrigger id="date_format"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="d/m/Y">DD/MM/YYYY</SelectItem>
                            <SelectItem value="m/d/Y">MM/DD/YYYY</SelectItem>
                            <SelectItem value="Y-m-d">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Logotipos */}
            <div className="grid gap-4 sm:grid-cols-3">
                <LogoField label="Logo claro" description="Para fondo blanco / tema claro"
                    field="logo_light" currentPath={company?.logo_light ?? null}
                    onChange={(f) => setData('logo_light', f)} />
                <LogoField label="Logo oscuro" description="Para fondo oscuro / tema dark"
                    field="logo_dark" currentPath={company?.logo_dark ?? null}
                    onChange={(f) => setData('logo_dark', f)} />
                <LogoField label="Logo PDF" description="Alta resolución para facturas y reportes (PNG/JPG)"
                    field="logo_pdf" currentPath={company?.logo_pdf ?? null}
                    onChange={(f) => setData('logo_pdf', f)} />
            </div>

            <div>
                <Button type="submit" disabled={processing}>
                    {processing ? <><Spinner className="mr-1" />Guardando…</> : 'Guardar empresa'}
                </Button>
            </div>
        </form>
    );
}

// ── Tab: Sucursales ────────────────────────────────────────────────────────────

function TabSucursales({ branches, users }: { branches: BranchRow[]; users: UserOption[] }) {
    const [editing, setEditing] = useState<BranchRow | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        name:    editing?.name ?? '',
        address: editing?.address ?? '',
        phone:   editing?.phone ?? '',
        email:   editing?.email ?? '',
        active:  editing?.active ?? true,
    });

    function startEdit(branch: BranchRow) {
        setEditing(branch);
        setData({ name: branch.name, address: branch.address ?? '', phone: branch.phone ?? '', email: branch.email ?? '', active: branch.active });
    }

    function cancelEdit() { setEditing(null); reset(); }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            patch(`/settings/branches/${editing.id}`, { onSuccess: () => cancelEdit() });
        } else {
            post('/settings/branches', { onSuccess: () => reset() });
        }
    }

    function deleteBranch(branch: BranchRow) {
        if (!confirm(`¿Eliminar la sucursal "${branch.name}"?`)) return;
        setDeletingId(branch.id);
        router.delete(`/settings/branches/${branch.id}`, { onFinish: () => setDeletingId(null) });
    }

    return (
        <div className="flex flex-col gap-6">
            <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                    <Label>Nombre *</Label>
                    <Input placeholder="Sucursal Central" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Dirección</Label>
                    <Input placeholder="Col. Palmira, Tegucigalpa" value={data.address} onChange={(e) => setData('address', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Teléfono</Label>
                    <Input placeholder="+504 2222-3333" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Correo de sucursal</Label>
                    <Input type="email" placeholder="sucursal@empresa.com" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                </div>
                <div className="flex items-center gap-2 self-end pb-1">
                    <Checkbox id="br_active" checked={data.active} onCheckedChange={(c) => setData('active', c === true)} />
                    <Label htmlFor="br_active" className="cursor-pointer">Activa</Label>
                </div>
                <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                    <Button type="submit" disabled={processing}>
                        {processing ? <><Spinner className="mr-1" />Guardando…</> : editing ? 'Actualizar sucursal' : 'Crear sucursal'}
                    </Button>
                    {editing && <Button type="button" variant="outline" onClick={cancelEdit}>Cancelar</Button>}
                </div>
            </form>

            {branches.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay sucursales registradas.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="pb-2 pr-4 font-medium">Nombre</th>
                                <th className="pb-2 pr-4 font-medium">Dirección</th>
                                <th className="pb-2 pr-4 font-medium">Teléfono</th>
                                <th className="pb-2 pr-4 font-medium">Correo</th>
                                <th className="pb-2 pr-4 font-medium">Usuarios</th>
                                <th className="pb-2 pr-4 font-medium">Estado</th>
                                <th className="pb-2 pr-4 font-medium">Editar</th>
                                <th className="pb-2 font-medium">Eliminar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {branches.map((branch) => (
                                <tr key={branch.id} className={`border-b last:border-0 ${editing?.id === branch.id ? 'bg-muted/40' : ''}`}>
                                    <td className="py-2 pr-4 font-medium">{branch.name}</td>
                                    <td className="py-2 pr-4 text-xs text-muted-foreground">{branch.address ?? '—'}</td>
                                    <td className="py-2 pr-4 text-xs text-muted-foreground">{branch.phone ?? '—'}</td>
                                    <td className="py-2 pr-4 text-xs text-muted-foreground">{branch.email ?? '—'}</td>
                                    <td className="py-2 pr-4">
                                        <BranchUsersDialog branch={branch} allUsers={users} />
                                    </td>
                                    <td className="py-2 pr-4">
                                        <Badge variant={branch.active ? 'secondary' : 'destructive'}>
                                            {branch.active ? 'Activa' : 'Inactiva'}
                                        </Badge>
                                    </td>
                                    <td className="py-2 pr-4">
                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => startEdit(branch)}>Editar</Button>
                                    </td>
                                    <td className="py-2">
                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                            disabled={deletingId === branch.id} onClick={() => deleteBranch(branch)}>
                                            {deletingId === branch.id ? <Spinner className="h-3 w-3" /> : '✕'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ── Tab: Operación ─────────────────────────────────────────────────────────────

function TabOperacion({ taxRates, currencies }: { taxRates: TaxRateRow[]; currencies: CurrencyRow[] }) {
    // ── Tax rates ─────────────────────────────────────────────────────────────
    const [editingTax, setEditingTax]   = useState<TaxRateRow | null>(null);
    const [deletingTaxId, setDeletingTaxId] = useState<number | null>(null);

    const { data: td, setData: setTd, post: tPost, patch: tPatch, processing: tProcessing, errors: tErrors, reset: tReset } = useForm({
        name:       '',
        rate:       '' as string,
        is_default: false,
        active:     true,
    });

    function startEditTax(t: TaxRateRow) {
        setEditingTax(t);
        setTd({ name: t.name, rate: t.rate, is_default: t.is_default, active: t.active });
    }

    function cancelEditTax() { setEditingTax(null); tReset(); }

    function submitTax(e: React.FormEvent) {
        e.preventDefault();
        if (editingTax) {
            tPatch(`/settings/tax-rates/${editingTax.id}`, { onSuccess: () => cancelEditTax() });
        } else {
            tPost('/settings/tax-rates', { onSuccess: () => tReset() });
        }
    }

    function deleteTax(t: TaxRateRow) {
        if (t.is_default) return;
        if (!confirm(`¿Eliminar la tasa "${t.name}"?`)) return;
        setDeletingTaxId(t.id);
        router.delete(`/settings/tax-rates/${t.id}`, { onFinish: () => setDeletingTaxId(null) });
    }

    // ── Currencies ────────────────────────────────────────────────────────────
    const [editingCurrency, setEditingCurrency] = useState<CurrencyRow | null>(null);
    const [deletingId, setDeletingId]           = useState<number | null>(null);

    const { data: cd, setData: setCd, post: cPost, patch: cPatch, processing: cProcessing, errors: cErrors, reset: cReset } = useForm({
        code:          '',
        name:          '',
        symbol:        '',
        exchange_rate: '1',
        is_primary:    false,
        active:        true,
    });

    function startEditCurrency(c: CurrencyRow) {
        setEditingCurrency(c);
        setCd({ code: c.code, name: c.name, symbol: c.symbol, exchange_rate: c.exchange_rate, is_primary: c.is_primary, active: c.active });
    }

    function cancelEditCurrency() { setEditingCurrency(null); cReset(); }

    function submitCurrency(e: React.FormEvent) {
        e.preventDefault();
        if (editingCurrency) {
            cPatch(`/settings/currencies/${editingCurrency.id}`, { onSuccess: () => cancelEditCurrency() });
        } else {
            cPost('/settings/currencies', { onSuccess: () => cReset() });
        }
    }

    function deleteCurrency(c: CurrencyRow) {
        if (!confirm(`¿Eliminar la moneda "${c.name}"?`)) return;
        setDeletingId(c.id);
        router.delete(`/settings/currencies/${c.id}`, { onFinish: () => setDeletingId(null) });
    }

    return (
        <div className="flex flex-col gap-8">
            {/* ── Tasas de impuesto ──────────────────────────────────────────── */}
            <div className="flex flex-col gap-4">
                <div>
                    <h3 className="text-sm font-semibold">Tasas de impuesto</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Define todas las tasas que aplican (ISV 15 %, ISV 18 %, Exento, etc.).
                        Marca una como predeterminada para que se seleccione al crear nuevos artículos.
                    </p>
                </div>

                {/* Tax rate form */}
                <form onSubmit={submitTax} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-1.5">
                        <Label>Nombre</Label>
                        <Input placeholder="ej. ISV 15 %" value={td.name}
                            onChange={(e) => setTd('name', e.target.value)} />
                        {tErrors.name && <p className="text-xs text-destructive">{tErrors.name}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Tasa (%)</Label>
                        <Input type="number" step="0.01" min="0" max="100" placeholder="15.00"
                            className="w-28"
                            value={td.rate}
                            onChange={(e) => setTd('rate', e.target.value)} />
                        {tErrors.rate && <p className="text-xs text-destructive">{tErrors.rate}</p>}
                    </div>
                    <div className="flex flex-col gap-3 justify-end pb-0.5">
                        <div className="flex items-center gap-2">
                            <Checkbox id="t_default" checked={td.is_default}
                                onCheckedChange={(v) => setTd('is_default', v === true)} />
                            <Label htmlFor="t_default" className="cursor-pointer">Predeterminada</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="t_active" checked={td.active}
                                onCheckedChange={(v) => setTd('active', v === true)} />
                            <Label htmlFor="t_active" className="cursor-pointer">Activa</Label>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <Button type="submit" disabled={tProcessing}>
                            {tProcessing ? <><Spinner className="mr-1" />Guardando…</> : editingTax ? 'Actualizar' : 'Agregar tasa'}
                        </Button>
                        {editingTax && (
                            <Button type="button" variant="outline" onClick={cancelEditTax}>Cancelar</Button>
                        )}
                    </div>
                </form>

                {/* Tax rates table */}
                {taxRates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Aún no se han definido tasas de impuesto. Agrega ISV 15 %, ISV 18 %, Exento (0 %), etc.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="pb-2 pr-4 font-medium">Nombre</th>
                                    <th className="pb-2 pr-4 font-medium">Tasa</th>
                                    <th className="pb-2 pr-4 font-medium">Estado</th>
                                    <th className="pb-2 pr-4 font-medium">Editar</th>
                                    <th className="pb-2 font-medium">Eliminar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {taxRates.map((t) => (
                                    <tr key={t.id} className={`border-b last:border-0 ${editingTax?.id === t.id ? 'bg-muted/40' : ''}`}>
                                        <td className="py-2 pr-4 font-medium">
                                            {t.name}
                                            {t.is_default && (
                                                <Badge variant="default" className="ml-2 text-[10px]">Predeterminada</Badge>
                                            )}
                                        </td>
                                        <td className="py-2 pr-4 font-mono text-muted-foreground">
                                            {Number(t.rate).toFixed(2)} %
                                        </td>
                                        <td className="py-2 pr-4">
                                            <Badge variant={t.active ? 'secondary' : 'destructive'}>
                                                {t.active ? 'Activa' : 'Inactiva'}
                                            </Badge>
                                        </td>
                                        <td className="py-2 pr-4">
                                            <Button variant="ghost" size="sm" className="h-7 text-xs"
                                                onClick={() => startEditTax(t)}>Editar</Button>
                                        </td>
                                        <td className="py-2">
                                            <Button variant="ghost" size="sm"
                                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                disabled={t.is_default || deletingTaxId === t.id}
                                                title={t.is_default ? 'No puedes eliminar la tasa predeterminada' : ''}
                                                onClick={() => deleteTax(t)}>
                                                {deletingTaxId === t.id ? <Spinner className="h-3 w-3" /> : '✕'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Monedas ────────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold">Monedas</h3>

                {/* Currency form */}
                <form onSubmit={submitCurrency} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col gap-1.5">
                        <Label>Código</Label>
                        <Input placeholder="HNL" className="font-mono uppercase" value={cd.code}
                            onChange={(e) => setCd('code', e.target.value.toUpperCase())} />
                        {cErrors.code && <p className="text-xs text-destructive">{cErrors.code}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Nombre</Label>
                        <Input placeholder="Lempira" value={cd.name}
                            onChange={(e) => setCd('name', e.target.value)} />
                        {cErrors.name && <p className="text-xs text-destructive">{cErrors.name}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Símbolo</Label>
                        <Input placeholder="L" className="w-20 font-mono" value={cd.symbol}
                            onChange={(e) => setCd('symbol', e.target.value)} />
                        {cErrors.symbol && <p className="text-xs text-destructive">{cErrors.symbol}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Tasa de cambio</Label>
                        <Input type="number" step="0.000001" min="0.000001" placeholder="1.000000"
                            value={cd.exchange_rate} onChange={(e) => setCd('exchange_rate', e.target.value)}
                            disabled={cd.is_primary} />
                        <p className="text-xs text-muted-foreground">Vs. moneda principal</p>
                        {cErrors.exchange_rate && <p className="text-xs text-destructive">{cErrors.exchange_rate}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox id="c_primary" checked={cd.is_primary}
                            onCheckedChange={(v) => setCd('is_primary', v === true)} />
                        <Label htmlFor="c_primary" className="cursor-pointer">Moneda principal</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox id="c_active" checked={cd.active}
                            onCheckedChange={(v) => setCd('active', v === true)} />
                        <Label htmlFor="c_active" className="cursor-pointer">Activa</Label>
                    </div>
                    <div className="flex items-end gap-2 sm:col-span-2">
                        <Button type="submit" disabled={cProcessing}>
                            {cProcessing ? <><Spinner className="mr-1" />Guardando…</> : editingCurrency ? 'Actualizar moneda' : 'Agregar moneda'}
                        </Button>
                        {editingCurrency && (
                            <Button type="button" variant="outline" onClick={cancelEditCurrency}>Cancelar</Button>
                        )}
                    </div>
                </form>

                {/* Currencies table */}
                {currencies.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aún no se han definido monedas.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="pb-2 pr-4 font-medium">Código</th>
                                    <th className="pb-2 pr-4 font-medium">Nombre</th>
                                    <th className="pb-2 pr-4 font-medium">Símbolo</th>
                                    <th className="pb-2 pr-4 font-medium">Tasa de cambio</th>
                                    <th className="pb-2 pr-4 font-medium">Estado</th>
                                    <th className="pb-2 pr-4 font-medium">Editar</th>
                                    <th className="pb-2 font-medium">Eliminar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currencies.map((c) => (
                                    <tr key={c.id} className={`border-b last:border-0 ${editingCurrency?.id === c.id ? 'bg-muted/40' : ''}`}>
                                        <td className="py-2 pr-4 font-mono font-medium">
                                            {c.code}
                                            {c.is_primary && (
                                                <Badge variant="default" className="ml-2 text-[10px]">Principal</Badge>
                                            )}
                                        </td>
                                        <td className="py-2 pr-4">{c.name}</td>
                                        <td className="py-2 pr-4 font-mono">{c.symbol}</td>
                                        <td className="py-2 pr-4 font-mono text-muted-foreground">
                                            {c.is_primary ? '1.000000' : Number(c.exchange_rate).toFixed(6)}
                                        </td>
                                        <td className="py-2 pr-4">
                                            <Badge variant={c.active ? 'secondary' : 'destructive'}>
                                                {c.active ? 'Activa' : 'Inactiva'}
                                            </Badge>
                                        </td>
                                        <td className="py-2 pr-4">
                                            <Button variant="ghost" size="sm" className="h-7 text-xs"
                                                onClick={() => startEditCurrency(c)}>Editar</Button>
                                        </td>
                                        <td className="py-2">
                                            <Button variant="ghost" size="sm"
                                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                disabled={c.is_primary || deletingId === c.id}
                                                title={c.is_primary ? 'No puedes eliminar la moneda principal' : ''}
                                                onClick={() => deleteCurrency(c)}>
                                                {deletingId === c.id ? <Spinner className="h-3 w-3" /> : '✕'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Tab: Correo SMTP ───────────────────────────────────────────────────────────

function TabCorreo({ smtp, smtpConfigured }: { smtp: SmtpSettings; smtpConfigured: boolean }) {
    const { data, setData, post, processing, errors } = useForm({
        host:         smtp.host,
        port:         smtp.port,
        username:     smtp.username,
        password:     '',
        encryption:   smtp.encryption,
        from_address: smtp.from_address,
        from_name:    smtp.from_name,
    });

    const [testing, setTesting]   = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/settings/smtp');
    }

    async function sendTest() {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/settings/smtp/test', {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '', 'Accept': 'application/json' },
            });
            setTestResult(await res.json());
        } catch {
            setTestResult({ success: false, error: 'Error de red al intentar enviar.' });
        } finally {
            setTesting(false);
        }
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1.5 lg:col-span-2">
                    <Label htmlFor="smtp_host">Servidor SMTP *</Label>
                    <Input id="smtp_host" placeholder="smtp.gmail.com" value={data.host}
                        onChange={(e) => setData('host', e.target.value)} />
                    {errors.host && <p className="text-xs text-destructive">{errors.host}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="smtp_port">Puerto *</Label>
                    <Input id="smtp_port" type="number" placeholder="587" value={data.port}
                        onChange={(e) => setData('port', Number(e.target.value))} />
                    {errors.port && <p className="text-xs text-destructive">{errors.port}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="smtp_user">Usuario *</Label>
                    <Input id="smtp_user" placeholder="correo@empresa.com" value={data.username}
                        onChange={(e) => setData('username', e.target.value)} />
                    {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="smtp_pass">Contraseña</Label>
                    <Input id="smtp_pass" type="password" placeholder={smtpConfigured ? '••••••••' : 'Contraseña'}
                        value={data.password} onChange={(e) => setData('password', e.target.value)} />
                    <p className="text-xs text-muted-foreground">Deja vacío para conservar la contraseña actual.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="smtp_enc">Cifrado *</Label>
                    <Select value={data.encryption} onValueChange={(v) => setData('encryption', v)}>
                        <SelectTrigger id="smtp_enc"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tls">TLS</SelectItem>
                            <SelectItem value="ssl">SSL</SelectItem>
                            <SelectItem value="none">Ninguno</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="from_address">Correo remitente *</Label>
                    <Input id="from_address" type="email" placeholder="no-reply@empresa.com"
                        value={data.from_address} onChange={(e) => setData('from_address', e.target.value)} />
                    {errors.from_address && <p className="text-xs text-destructive">{errors.from_address}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="from_name">Nombre remitente *</Label>
                    <Input id="from_name" placeholder="Mi Empresa" value={data.from_name}
                        onChange={(e) => setData('from_name', e.target.value)} />
                    {errors.from_name && <p className="text-xs text-destructive">{errors.from_name}</p>}
                </div>
            </div>

            {testResult && (
                <div className={`rounded-lg border px-4 py-3 text-sm ${testResult.success
                    ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
                    : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300'}`}>
                    {testResult.success ? '✓ Correo de prueba enviado correctamente.' : `✗ Error: ${testResult.error}`}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={processing}>
                    {processing ? <><Spinner className="mr-1" />Guardando…</> : 'Guardar configuración SMTP'}
                </Button>
                {smtpConfigured && (
                    <Button type="button" variant="outline" disabled={testing} onClick={sendTest}>
                        {testing ? <><Spinner className="mr-1" />Enviando…</> : 'Enviar correo de prueba'}
                    </Button>
                )}
            </div>
        </form>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsIndex({ company, users, currencies, tax_rates, smtp, smtp_configured }: Props) {
    const { props } = usePage<{
        flash?: { success?: string; error?: string; setup_notice?: string };
        auth: { setup: { has_company: boolean; has_branch: boolean; has_subscription: boolean } };
    }>();
    const flash   = props.flash;
    const setup   = props.auth?.setup ?? { has_company: false, has_branch: false, has_subscription: false };
    const blockedByCompany = !setup.has_company;
    const blockedBySubscription = !setup.has_subscription;
    const sucursalesLocked = blockedByCompany;
    const operacionLocked = blockedByCompany || blockedBySubscription;
    const correoLocked = blockedByCompany || blockedBySubscription;

    type Tab = 'empresa' | 'sucursales' | 'operacion' | 'correo';
    const [tab, setTab] = useState<Tab>('empresa');

    const branches = company?.branches ?? [];

    return (
        <>
            <Head title="Configuración" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {(flash?.setup_notice || flash?.success || flash?.error) && (
                    <>
                        {flash?.setup_notice && (
                            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                                {flash.setup_notice}
                            </div>
                        )}
                        {flash?.success && (
                            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                                {flash.success}
                            </div>
                        )}
                        {flash?.error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                                {flash.error}
                            </div>
                        )}
                    </>
                )}

                {/* Setup notice when no company */}
                {blockedByCompany && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
                        <Lock className="h-4 w-4 shrink-0" />
                        <span>
                            <strong>Paso 1:</strong> Registra los datos de tu empresa para habilitar Sucursales, Operación y Correo.
                        </span>
                    </div>
                )}

                <Card>
                    <CardHeader className="pb-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Settings className="h-4 w-4" />
                            Configuración del sistema
                        </CardTitle>
                        <CardDescription>
                            Parámetros globales que se propagan a todos los módulos del sistema.
                        </CardDescription>

                        {/* Main tabs */}
                        <div className="flex border-b pt-2">
                            <TabButton active={tab === 'empresa'} onClick={() => setTab('empresa')} icon={Building2}>Empresa</TabButton>
                            <TabButton
                                active={tab === 'sucursales'}
                                onClick={() => !sucursalesLocked && setTab('sucursales')}
                                icon={sucursalesLocked ? Lock : Globe}
                                className={sucursalesLocked ? 'cursor-not-allowed opacity-50' : ''}
                            >
                                Sucursales
                                {branches.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 text-xs">{branches.length}</Badge>
                                )}
                            </TabButton>
                            <TabButton
                                active={tab === 'operacion'}
                                onClick={() => !operacionLocked && setTab('operacion')}
                                icon={operacionLocked ? Lock : Settings}
                                className={operacionLocked ? 'cursor-not-allowed opacity-50' : ''}
                            >
                                Operación
                            </TabButton>
                            <TabButton
                                active={tab === 'correo'}
                                onClick={() => !correoLocked && setTab('correo')}
                                icon={correoLocked ? Lock : Mail}
                                className={correoLocked ? 'cursor-not-allowed opacity-50' : ''}
                            >
                                Correo
                                {!correoLocked && smtp_configured && <Badge variant="secondary" className="ml-1 text-xs">✓</Badge>}
                            </TabButton>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                        {tab === 'empresa'    && <TabEmpresa company={company} />}
                        {tab === 'sucursales' && !sucursalesLocked && <TabSucursales branches={branches} users={users} />}
                        {tab === 'operacion'  && !operacionLocked && <TabOperacion taxRates={tax_rates ?? []} currencies={currencies ?? []} />}
                        {tab === 'correo'     && !correoLocked && <TabCorreo smtp={smtp} smtpConfigured={smtp_configured} />}
                        {(tab === 'sucursales' || tab === 'operacion' || tab === 'correo') && blockedByCompany && (
                            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
                                <Lock className="h-10 w-10 opacity-30" />
                                <p className="font-medium">Empresa requerida</p>
                                <p className="text-sm">Guarda primero la información de la empresa para habilitar estas secciones.</p>
                            </div>
                        )}
                        {(tab === 'operacion' || tab === 'correo') && !blockedByCompany && blockedBySubscription && (
                            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-3">
                                <Lock className="h-10 w-10 opacity-30" />
                                <p className="font-medium">Licencia requerida</p>
                                <p className="text-sm">Activa tu licencia en el módulo de Suscripciones para acceder a esta configuración.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SettingsIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Configuración', href: '/settings' },
    ],
};
