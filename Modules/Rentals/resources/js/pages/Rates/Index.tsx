import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Edit2, Package, Plus, Search, Trash2, X } from 'lucide-react';
import { Fragment, useState } from 'react';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Alquileres', href: '/rentals' },
    { title: 'Tarifas', href: '/rentals/config/rates' },
];

const fmt = (n: string | number) =>
    Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Rate {
    id: number;
    hourly_price: string; daily_price: string;
    weekly_price: string; monthly_price: string;
    deposit_amount: string; buffer_hours_before: number;
    buffer_hours_after: number; maintenance_limit_days?: number;
    notes?: string;
    product: { id: number; sku: string; name: string };
}

interface Product { id: number; sku: string; name: string }

interface Props {
    rates: { data: Rate[]; links: any[] };
    productsWithoutRate: Product[];
    filters: { search?: string };
}

const emptyForm = () => ({
    product_id: '' as number | '',
    hourly_price: 0, daily_price: 0, weekly_price: 0, monthly_price: 0,
    deposit_amount: 0, buffer_hours_before: 1, buffer_hours_after: 1,
    maintenance_limit_days: '' as number | '',
    notes: '',
});

export default function RatesIndex({ rates, productsWithoutRate, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editingRate, setEditingRate] = useState<Rate | null>(null);
    const [showNew, setShowNew] = useState(false);

    const createForm = useForm(emptyForm());
    const editForm   = useForm(emptyForm());

    const startEdit = (rate: Rate) => {
        setEditingRate(rate);
        editForm.setData({
            product_id:           rate.product.id,
            hourly_price:         Number(rate.hourly_price),
            daily_price:          Number(rate.daily_price),
            weekly_price:         Number(rate.weekly_price),
            monthly_price:        Number(rate.monthly_price),
            deposit_amount:       Number(rate.deposit_amount),
            buffer_hours_before:  rate.buffer_hours_before,
            buffer_hours_after:   rate.buffer_hours_after,
            maintenance_limit_days: rate.maintenance_limit_days ?? '',
            notes:                rate.notes ?? '',
        });
    };

    const handleDelete = (rate: Rate) => {
        if (confirm(`¿Eliminar tarifa de "${rate.product.name}"?`)) {
            router.delete(`/rentals/config/rates/${rate.id}`);
        }
    };

    const PriceRow = ({ label, field, form }: { label: string; field: string; form: any }) => (
        <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
            <Input 
                type="number" 
                step="0.01" 
                min="0"
                value={(form.data as any)[field]}
                onChange={(e) => form.setData(field, parseFloat(e.target.value) || 0)}
                className="h-9"
            />
        </div>
    );

    const RateFormFields = ({ form }: { form: any }) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PriceRow label="Por hora"   field="hourly_price"  form={form} />
            <PriceRow label="Por día"    field="daily_price"   form={form} />
            <PriceRow label="Por semana" field="weekly_price"  form={form} />
            <PriceRow label="Por mes"    field="monthly_price" form={form} />
            <PriceRow label="Depósito"   field="deposit_amount" form={form} />
            <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Límite días mantenimiento</Label>
                <Input type="number" min="1"
                    value={form.data.maintenance_limit_days}
                    onChange={(e) => form.setData('maintenance_limit_days', e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="Ej: 30"
                    className="h-9"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Buffer antes (horas)</Label>
                <Input type="number" min="0"
                    value={form.data.buffer_hours_before}
                    onChange={(e) => form.setData('buffer_hours_before', parseInt(e.target.value) || 0)}
                    className="h-9"
                />
            </div>
            <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Buffer después (horas)</Label>
                <Input type="number" min="0"
                    value={form.data.buffer_hours_after}
                    onChange={(e) => form.setData('buffer_hours_after', parseInt(e.target.value) || 0)}
                    className="h-9"
                />
            </div>
            <div className="col-span-1 sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas</Label>
                <Input 
                    value={form.data.notes}
                    onChange={(e) => form.setData('notes', e.target.value)}
                    className="h-9"
                />
            </div>
        </div>
    );

    return (
        <>
            <Head title="Tarifas de Alquiler" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Package className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Tarifas de Alquiler</h1>
                            <p className="text-sm text-muted-foreground">Configuración de precios por producto</p>
                        </div>
                    </div>

                    <Button onClick={() => setShowNew(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm shadow-primary/20">
                        <Plus className="mr-1.5 h-4 w-4" />
                        Nueva Tarifa
                    </Button>
                </div>

                {/* New rate form */}
                {showNew && (
                    <Card className="border-primary/20 shadow-md shadow-primary/5 animate-in fade-in slide-in-from-top-2">
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-foreground">Nueva Tarifa</h2>
                                <Button variant="ghost" size="icon" onClick={() => setShowNew(false)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Producto *</Label>
                                <Select 
                                    value={String(createForm.data.product_id)} 
                                    onValueChange={(v) => createForm.setData('product_id', Number(v))}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Seleccionar producto..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {productsWithoutRate.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>[{p.sku}] {p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <RateFormFields form={createForm} />

                            <div className="flex gap-2 pt-2">
                                <Button onClick={() => createForm.post('/rentals/config/rates', { onSuccess: () => { setShowNew(false); createForm.reset(); } })}
                                    disabled={createForm.processing}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 px-6">
                                    {createForm.processing ? 'Guardando...' : 'Guardar'}
                                </Button>
                                <Button variant="outline" onClick={() => setShowNew(false)} className="h-9">
                                    Cancelar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Search */}
                <div className="flex items-center gap-2 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por producto..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && router.get('/rentals/config/rates', { search }, { preserveState: true })}
                            className="pl-9"
                        />
                    </div>
                    <Button 
                        variant="secondary" 
                        onClick={() => router.get('/rentals/config/rates', { search }, { preserveState: true })}
                        className="font-semibold"
                    >
                        Filtrar
                    </Button>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Producto</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Hora</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Día</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Semana</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Mes</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Depósito</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Mant. días</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rates.data.map((rate) => (
                                <Fragment key={rate.id}>
                                    <tr className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-foreground">{rate.product.name}</div>
                                            <div className="text-xs text-muted-foreground">{rate.product.sku}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-foreground">{fmt(rate.hourly_price)}</td>
                                        <td className="px-4 py-3 text-right text-foreground">{fmt(rate.daily_price)}</td>
                                        <td className="px-4 py-3 text-right text-foreground">{fmt(rate.weekly_price)}</td>
                                        <td className="px-4 py-3 text-right text-foreground">{fmt(rate.monthly_price)}</td>
                                        <td className="px-4 py-3 text-right text-foreground">{fmt(rate.deposit_amount)}</td>
                                        <td className="px-4 py-3 text-center text-muted-foreground">
                                            {rate.maintenance_limit_days ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => startEdit(rate)} className="rounded p-1 hover:bg-accent text-foreground transition-colors">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(rate)} className="rounded p-1 text-destructive hover:bg-destructive/10 transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {editingRate?.id === rate.id && (
                                        <tr>
                                            <td colSpan={8} className="bg-muted px-4 py-4">
                                                <div className="max-w-4xl mx-auto space-y-4">
                                                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                                        <Edit2 className="h-4 w-4 text-primary" />
                                                        Editando Tarifa: {rate.product.name}
                                                    </h3>
                                                    <RateFormFields form={editForm} />
                                                    <div className="flex gap-2 pt-2">
                                                        <Button
                                                            onClick={() => editForm.patch(`/rentals/config/rates/${rate.id}`, { onSuccess: () => setEditingRate(null) })}
                                                            disabled={editForm.processing}
                                                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 px-6">
                                                            {editForm.processing ? 'Guardando...' : 'Guardar cambios'}
                                                        </Button>
                                                        <Button variant="outline" onClick={() => setEditingRate(null)} className="h-9">
                                                            Cancelar
                                                        </Button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {rates.links && (
                    <div className="flex justify-center gap-1">
                        {rates.links.map((link: any, i: number) => (
                            <button key={i} disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                className={`rounded px-3 py-1 text-sm transition-colors ${link.active ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : 'border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'} disabled:opacity-40`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

RatesIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
