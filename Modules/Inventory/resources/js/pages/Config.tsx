import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ImagePicker } from '@/components/image-picker';
import { dashboard } from '@/routes';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AccountOption {
    id: number;
    code: string;
    name: string;
}

interface CategoryRow {
    id: number;
    name: string;
    account_inventory_id: number | null;
    account_income_id: number | null;
    account_cogs_id: number | null;
    account_inventory: AccountOption | null;
    account_income: AccountOption | null;
    account_cogs: AccountOption | null;
    image_path: string | null;
    active: boolean;
}

interface UomRow {
    id: number;
    name: string;
    abbreviation: string;
    active: boolean;
}

interface WarehouseRow {
    id: number;
    branch_id: number;
    name: string;
    code: string;
    active: boolean;
    branch?: { id: number; name: string };
}

interface BranchRow {
    id: number;
    name: string;
}

interface Props {
    categories: CategoryRow[];
    uoms: UomRow[];
    warehouses: WarehouseRow[];
    branches: BranchRow[];
    accounts_asset: AccountOption[];
    accounts_income: AccountOption[];
    accounts_expense: AccountOption[];
}

// ── AccountSelect ──────────────────────────────────────────────────────────────

function AccountSelect({
    accounts,
    value,
    onChange,
    placeholder,
}: {
    accounts: AccountOption[];
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
}) {
    const [search, setSearch] = useState('');
    const [open, setOpen]     = useState(false);
    const wrapperRef          = useRef<HTMLDivElement>(null);

    const selected = accounts.find((a) => String(a.id) === value) ?? null;

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
        }
        if (open) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return accounts
            .filter((a) => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
            .slice(0, 80);
    }, [search, accounts]);

    return (
        <div ref={wrapperRef} className="relative">
            <div
                className={`flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 text-sm cursor-pointer transition-colors ${open ? 'border-primary ring-1 ring-primary/20' : 'border-input'}`}
                onClick={() => { setOpen((o) => !o); setSearch(''); }}
            >
                {selected ? (
                    <span className="font-mono text-xs truncate">{selected.code} — {selected.name}</span>
                ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                )}
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
            </div>

            {open && (
                <div className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] bg-popover border border-border rounded-md shadow-md flex flex-col">
                    <div className="p-2 border-b">
                        <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por código o nombre..."
                            className="w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                        />
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1">
                        <button
                            type="button"
                            onClick={() => { onChange('__none__'); setOpen(false); }}
                            className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent text-muted-foreground italic"
                        >
                            Sin cuenta
                        </button>
                        {filtered.length === 0 ? (
                            <p className="py-4 text-center text-xs text-muted-foreground">Sin resultados</p>
                        ) : (
                            filtered.map((a) => (
                                <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => { onChange(String(a.id)); setOpen(false); }}
                                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent flex items-center gap-2 ${String(a.id) === value ? 'bg-accent' : ''}`}
                                >
                                    <span className="font-mono text-xs text-muted-foreground w-16 shrink-0">{a.code}</span>
                                    <span className="truncate">{a.name}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

type TabKey = 'categories' | 'uoms' | 'warehouses';

// ── Categories Tab ─────────────────────────────────────────────────────────────

function CategoriesTab({ categories, accounts_asset, accounts_income, accounts_expense }: {
    categories: CategoryRow[];
    accounts_asset: AccountOption[];
    accounts_income: AccountOption[];
    accounts_expense: AccountOption[];
}) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        name:                 '',
        account_inventory_id: '__none__' as string,
        account_income_id:    '__none__' as string,
        account_cogs_id:      '__none__' as string,
        image_path:           '',
        active:               true as boolean,
    });

    function toVal(id: number | null) { return id ? String(id) : '__none__'; }

    function startEdit(row: CategoryRow) {
        setEditingId(row.id);
        setData({
            name:                 row.name,
            account_inventory_id: toVal(row.account_inventory_id),
            account_income_id:    toVal(row.account_income_id),
            account_cogs_id:      toVal(row.account_cogs_id),
            image_path:           row.image_path ?? '',
            active:               row.active,
        });
    }

    function cancelEdit() {
        setEditingId(null);
        reset();
    }

    function nullify(val: string) { return val === '__none__' ? null : val; }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            ...data,
            account_inventory_id: nullify(data.account_inventory_id),
            account_income_id:    nullify(data.account_income_id),
            account_cogs_id:      nullify(data.account_cogs_id),
        };
        if (editingId !== null) {
            patch(`/inventory/config/categories/${editingId}`, {
                data: payload,
                onSuccess: () => { setEditingId(null); reset(); },
            } as any);
        } else {
            post('/inventory/config/categories', {
                data: payload,
                onSuccess: () => reset(),
            } as any);
        }
    }

    function deleteRow(row: CategoryRow) {
        if (!confirm(`¿Eliminar la categoría "${row.name}"?`)) return;
        setDeletingId(row.id);
        router.delete(`/inventory/config/categories/${row.id}`, {
            onFinish: () => setDeletingId(null),
        });
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Form */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Plus className="h-4 w-4" />
                        {editingId !== null ? 'Editar categoría' : 'Nueva categoría'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="cat_name">Nombre *</Label>
                            <Input
                                id="cat_name"
                                placeholder="Mercancías generales"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Cta. Inventario <span className="text-[10px] text-muted-foreground">(Activo)</span></Label>
                            <AccountSelect
                                accounts={accounts_asset}
                                value={data.account_inventory_id}
                                onChange={(v) => setData('account_inventory_id', v)}
                                placeholder="Seleccionar cuenta de activo..."
                            />
                            {errors.account_inventory_id && <p className="text-xs text-destructive">{errors.account_inventory_id}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Cta. Ingresos <span className="text-[10px] text-muted-foreground">(Ingreso)</span></Label>
                            <AccountSelect
                                accounts={accounts_income}
                                value={data.account_income_id}
                                onChange={(v) => setData('account_income_id', v)}
                                placeholder="Seleccionar cuenta de ingreso..."
                            />
                            {errors.account_income_id && <p className="text-xs text-destructive">{errors.account_income_id}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Cta. Costo de Ventas <span className="text-[10px] text-muted-foreground">(Gasto)</span></Label>
                            <AccountSelect
                                accounts={accounts_expense}
                                value={data.account_cogs_id}
                                onChange={(v) => setData('account_cogs_id', v)}
                                placeholder="Seleccionar cuenta de gasto..."
                            />
                            {errors.account_cogs_id && <p className="text-xs text-destructive">{errors.account_cogs_id}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="cat_image">Imagen de Categoría</Label>
                            <ImagePicker
                                id="cat_image"
                                folder="categories"
                                placeholder="categories/example.jpg"
                                value={data.image_path}
                                onChange={(val) => setData('image_path', val)}
                            />
                        </div>
                        <div className="flex items-end gap-2 pb-1">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="cat_active"
                                    checked={data.active}
                                    onCheckedChange={(v) => setData('active', v === true)}
                                />
                                <Label htmlFor="cat_active" className="cursor-pointer">Activa</Label>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <Button type="submit" size="sm" disabled={processing}>
                                {processing
                                    ? <><Spinner className="mr-1 h-3 w-3" />Guardando…</>
                                    : editingId !== null ? 'Actualizar' : 'Agregar'}
                            </Button>
                            {editingId !== null && (
                                <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                                    Cancelar
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="pt-4">
                    {categories.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                            No hay categorías. Agrega la primera.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="pb-2 pr-4 font-medium italic text-[10px] uppercase tracking-wider">Imagen</th>
                                        <th className="pb-2 pr-4 font-medium">Nombre</th>
                                        <th className="pb-2 pr-4 font-medium">Cta. Inventario</th>
                                        <th className="pb-2 pr-4 font-medium">Cta. Ingresos</th>
                                        <th className="pb-2 pr-4 font-medium">Cta. COGS</th>
                                        <th className="pb-2 pr-4 font-medium">Estado</th>
                                        <th className="pb-2 pr-4 font-medium">Editar</th>
                                        <th className="pb-2 font-medium">Eliminar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((row) => (
                                        <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="py-2 pr-4">
                                                <div className="h-8 w-8 overflow-hidden rounded-md border bg-muted">
                                                    {row.image_path ? (
                                                        <img src={`/storage/${row.image_path}`} alt={row.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Package className="h-full w-full p-1.5 opacity-20" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2 pr-4 font-medium">{row.name}</td>
                                            <td className="py-2 pr-4 text-xs text-muted-foreground">
                                                {row.account_inventory ? <span className="font-mono">{row.account_inventory.code}</span> : '—'}
                                            </td>
                                            <td className="py-2 pr-4 text-xs text-muted-foreground">
                                                {row.account_income ? <span className="font-mono">{row.account_income.code}</span> : '—'}
                                            </td>
                                            <td className="py-2 pr-4 text-xs text-muted-foreground">
                                                {row.account_cogs ? <span className="font-mono">{row.account_cogs.code}</span> : '—'}
                                            </td>
                                            <td className="py-2 pr-4">
                                                <Badge variant={row.active ? 'secondary' : 'outline'}>
                                                    {row.active ? 'Activa' : 'Inactiva'}
                                                </Badge>
                                            </td>
                                            <td className="py-2 pr-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => startEdit(row)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            </td>
                                            <td className="py-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                    disabled={deletingId === row.id}
                                                    onClick={() => deleteRow(row)}
                                                >
                                                    {deletingId === row.id
                                                        ? <Spinner className="h-3 w-3" />
                                                        : <Trash2 className="h-3.5 w-3.5" />}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ── UoM Tab ────────────────────────────────────────────────────────────────────

function UomsTab({ uoms }: { uoms: UomRow[] }) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        name: '',
        abbreviation: '',
        active: true as boolean,
    });

    function startEdit(row: UomRow) {
        setEditingId(row.id);
        setData({ name: row.name, abbreviation: row.abbreviation, active: row.active });
    }

    function cancelEdit() {
        setEditingId(null);
        reset();
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editingId !== null) {
            patch(`/inventory/config/uoms/${editingId}`, {
                onSuccess: () => { setEditingId(null); reset(); },
            });
        } else {
            post('/inventory/config/uoms', {
                onSuccess: () => reset(),
            });
        }
    }

    function deleteRow(row: UomRow) {
        if (!confirm(`¿Eliminar la unidad "${row.name}"?`)) return;
        setDeletingId(row.id);
        router.delete(`/inventory/config/uoms/${row.id}`, {
            onFinish: () => setDeletingId(null),
        });
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Form */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Plus className="h-4 w-4" />
                        {editingId !== null ? 'Editar unidad de medida' : 'Nueva unidad de medida'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="flex flex-wrap items-end gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="uom_name">Nombre *</Label>
                            <Input
                                id="uom_name"
                                placeholder="Kilogramo"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                className="w-48"
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="uom_abbr">Abreviación *</Label>
                            <Input
                                id="uom_abbr"
                                placeholder="kg"
                                value={data.abbreviation}
                                onChange={(e) => setData('abbreviation', e.target.value)}
                                required
                                className="w-24"
                            />
                            {errors.abbreviation && <p className="text-xs text-destructive">{errors.abbreviation}</p>}
                        </div>
                        <div className="flex items-center gap-2 pb-1">
                            <Checkbox
                                id="uom_active"
                                checked={data.active}
                                onCheckedChange={(v) => setData('active', v === true)}
                            />
                            <Label htmlFor="uom_active" className="cursor-pointer">Activa</Label>
                        </div>
                        <div className="flex items-end gap-2 pb-1">
                            <Button type="submit" size="sm" disabled={processing}>
                                {processing
                                    ? <><Spinner className="mr-1 h-3 w-3" />Guardando…</>
                                    : editingId !== null ? 'Actualizar' : 'Agregar'}
                            </Button>
                            {editingId !== null && (
                                <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                                    Cancelar
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="pt-4">
                    {uoms.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                            No hay unidades de medida. Agrega la primera.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="pb-2 pr-4 font-medium">Nombre</th>
                                        <th className="pb-2 pr-4 font-medium">Abreviación</th>
                                        <th className="pb-2 pr-4 font-medium">Estado</th>
                                        <th className="pb-2 pr-4 font-medium">Editar</th>
                                        <th className="pb-2 font-medium">Eliminar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {uoms.map((row) => (
                                        <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="py-2 pr-4 font-medium">{row.name}</td>
                                            <td className="py-2 pr-4 font-mono text-xs">{row.abbreviation}</td>
                                            <td className="py-2 pr-4">
                                                <Badge variant={row.active ? 'secondary' : 'outline'}>
                                                    {row.active ? 'Activa' : 'Inactiva'}
                                                </Badge>
                                            </td>
                                            <td className="py-2 pr-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => startEdit(row)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            </td>
                                            <td className="py-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                    disabled={deletingId === row.id}
                                                    onClick={() => deleteRow(row)}
                                                >
                                                    {deletingId === row.id
                                                        ? <Spinner className="h-3 w-3" />
                                                        : <Trash2 className="h-3.5 w-3.5" />}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ── Warehouses Tab ─────────────────────────────────────────────────────────────

function WarehousesTab({ warehouses, branches }: { warehouses: WarehouseRow[]; branches: BranchRow[] }) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const { data, setData, post, patch, processing, errors, reset } = useForm({
        branch_id: '__none__' as string,
        name: '',
        code: '',
        active: true as boolean,
    });

    function startEdit(row: WarehouseRow) {
        setEditingId(row.id);
        setData({
            branch_id: row.branch_id ? String(row.branch_id) : '__none__',
            name: row.name,
            code: row.code,
            active: row.active,
        });
    }

    function cancelEdit() {
        setEditingId(null);
        reset();
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            ...data,
            branch_id: data.branch_id === '__none__' ? '' : data.branch_id,
        };
        if (editingId !== null) {
            router.patch(`/inventory/config/warehouses/${editingId}`, payload, {
                onSuccess: () => { setEditingId(null); reset(); },
            });
        } else {
            router.post('/inventory/config/warehouses', payload, {
                onSuccess: () => reset(),
            });
        }
    }

    function deleteRow(row: WarehouseRow) {
        if (!confirm(`¿Eliminar el almacén "${row.name}"?`)) return;
        setDeletingId(row.id);
        router.delete(`/inventory/config/warehouses/${row.id}`, {
            onFinish: () => setDeletingId(null),
        });
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Form */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Plus className="h-4 w-4" />
                        {editingId !== null ? 'Editar almacén' : 'Nuevo almacén'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="flex flex-col gap-1.5">
                            <Label>Sucursal</Label>
                            <Select
                                value={data.branch_id}
                                onValueChange={(v) => setData('branch_id', v)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Sin sucursal" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Sin sucursal</SelectItem>
                                    {branches.map((b) => (
                                        <SelectItem key={b.id} value={String(b.id)}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="wh_name">Nombre *</Label>
                            <Input
                                id="wh_name"
                                placeholder="Bodega Central"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="wh_code">Código *</Label>
                            <Input
                                id="wh_code"
                                placeholder="WH-001"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                required
                                className="font-mono"
                            />
                            {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
                        </div>
                        <div className="flex items-end gap-3 pb-1">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="wh_active"
                                    checked={data.active}
                                    onCheckedChange={(v) => setData('active', v === true)}
                                />
                                <Label htmlFor="wh_active" className="cursor-pointer">Activo</Label>
                            </div>
                            <Button type="submit" size="sm" disabled={processing}>
                                {processing
                                    ? <><Spinner className="mr-1 h-3 w-3" />Guardando…</>
                                    : editingId !== null ? 'Actualizar' : 'Agregar'}
                            </Button>
                            {editingId !== null && (
                                <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                                    Cancelar
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="pt-4">
                    {warehouses.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-6 text-center">
                            No hay almacenes. Agrega el primero.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="pb-2 pr-4 font-medium">Nombre</th>
                                        <th className="pb-2 pr-4 font-medium">Código</th>
                                        <th className="pb-2 pr-4 font-medium">Sucursal</th>
                                        <th className="pb-2 pr-4 font-medium">Estado</th>
                                        <th className="pb-2 pr-4 font-medium">Editar</th>
                                        <th className="pb-2 font-medium">Eliminar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {warehouses.map((row) => (
                                        <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="py-2 pr-4 font-medium">{row.name}</td>
                                            <td className="py-2 pr-4 font-mono text-xs">{row.code}</td>
                                            <td className="py-2 pr-4 text-xs text-muted-foreground">
                                                {row.branch?.name ?? '—'}
                                            </td>
                                            <td className="py-2 pr-4">
                                                <Badge variant={row.active ? 'secondary' : 'outline'}>
                                                    {row.active ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </td>
                                            <td className="py-2 pr-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => startEdit(row)}
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            </td>
                                            <td className="py-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                    disabled={deletingId === row.id}
                                                    onClick={() => deleteRow(row)}
                                                >
                                                    {deletingId === row.id
                                                        ? <Spinner className="h-3 w-3" />
                                                        : <Trash2 className="h-3.5 w-3.5" />}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string }[] = [
    { key: 'categories', label: 'Categorías' },
    { key: 'uoms',       label: 'Unidades de Medida' },
    { key: 'warehouses', label: 'Almacenes' },
];

export default function InventoryConfig({ categories, uoms, warehouses, branches, accounts_asset, accounts_income, accounts_expense }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const [activeTab, setActiveTab] = useState<TabKey>('categories');

    return (
        <>
            <Head title="Configuración de Inventario" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                {/* Tab navigation */}
                <div className="flex gap-1 border-b">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                activeTab === tab.key
                                    ? 'border-primary text-foreground'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                {activeTab === 'categories' && <CategoriesTab categories={categories} accounts_asset={accounts_asset} accounts_income={accounts_income} accounts_expense={accounts_expense} />}
                {activeTab === 'uoms'       && <UomsTab uoms={uoms} />}
                {activeTab === 'warehouses' && <WarehousesTab warehouses={warehouses} branches={branches} />}
            </div>
        </>
    );
}

InventoryConfig.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Inventario', href: '/inventory' },
        { title: 'Configuración', href: '/inventory/config' },
    ],
};
