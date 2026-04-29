import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Package, XCircle } from 'lucide-react';

interface ChecklistItem {
    id: number; label: string; condition: string; notes?: string;
    order_line: { product: { name: string } };
}

interface Line {
    id: number; qty: string;
    product: { id: number; name: string; sku: string };
    lot?: { lot_number: string } | null;
}

interface Order {
    id: number; reference: string; customer: { name: string };
    start_date: string; end_date: string; deposit_amount: string;
    lines: Line[];
    delivery_checklist?: {
        overall_condition: string;
        items: ChecklistItem[];
    };
}

interface Props { order: Order }

const CONDITIONS = [
    { value: 'ok',      label: 'OK',       icon: CheckCircle2, color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { value: 'damaged', label: 'Dañado',   icon: AlertTriangle, color: 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { value: 'missing', label: 'Faltante', icon: XCircle,       color: 'border-destructive/50 bg-destructive/10 text-destructive' },
];

const CONDITION_COLORS: Record<string, string> = {
    ok: 'text-emerald-600 dark:text-emerald-400', 
    damaged: 'text-amber-600 dark:text-amber-400', 
    missing: 'text-destructive',
};

const fmt = (n: string | number) =>
    Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function RentalReturn({ order }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Alquileres', href: '/rentals' },
        { title: order.reference, href: `/rentals/${order.id}` },
        { title: 'Registrar Devolución', href: '#' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        returned_at:       new Date().toISOString().split('T')[0],
        overall_condition: 'good',
        deposit_status:    'released',
        damage_charges:    0,
        notes:             '',
        items: order.lines.map((line) => ({
            rental_order_line_id: line.id,
            label:     line.product.name + (line.lot ? ` #${line.lot.lot_number}` : ''),
            condition: 'ok',
            notes:     '',
        })),
    });

    const updateItem = (i: number, field: string, value: string) => {
        const items = [...data.items];
        items[i] = { ...items[i], [field]: value };

        // Auto-apply damage charges suggestion when item marked damaged/missing
        if (field === 'condition' && (value === 'damaged' || value === 'missing')) {
            setData({ ...data, items, deposit_status: 'applied' });
            return;
        }

        setData('items', items);
    };

    const hasDamages = data.items.some((it) => it.condition !== 'ok');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/rentals/${order.id}/return`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <form onSubmit={handleSubmit}>
                <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => router.visit(`/rentals/${order.id}`)}
                            className="rounded p-1 hover:bg-muted text-foreground transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-foreground">Checklist de Devolución</h1>
                            <p className="text-sm text-muted-foreground">{order.reference} — {order.customer.name}</p>
                        </div>
                    </div>

                    {hasDamages && (
                        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive animate-pulse">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            Se detectaron daños o faltantes. Registra los cargos correspondientes antes de confirmar.
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-4">
                            {/* Return info */}
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                <h2 className="mb-3 font-medium text-foreground">Datos de Devolución</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha de devolución *</label>
                                        <input type="date" value={data.returned_at}
                                            onChange={(e) => setData('returned_at', e.target.value)}
                                            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Condición general</label>
                                        <select value={data.overall_condition} onChange={(e) => setData('overall_condition', e.target.value)}
                                            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                                            <option value="excellent">Excelente</option>
                                            <option value="good">Bueno</option>
                                            <option value="fair">Regular</option>
                                            <option value="poor">Malo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Acción con depósito</label>
                                        <select value={data.deposit_status} onChange={(e) => setData('deposit_status', e.target.value)}
                                            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                                            <option value="released">Liberar al cliente</option>
                                            <option value="applied">Aplicar a daños</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Cargos por daños</label>
                                        <input type="number" step="0.01" min="0"
                                            value={data.damage_charges}
                                            onChange={(e) => setData('damage_charges', parseFloat(e.target.value) || 0)}
                                            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Observaciones</label>
                                        <textarea rows={2} value={data.notes} onChange={(e) => setData('notes', e.target.value)}
                                            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                    </div>
                                </div>
                            </div>

                            {/* Comparison with delivery checklist */}
                            {order.delivery_checklist && (
                                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm">
                                    <p className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Estado al momento de la entrega:</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {order.delivery_checklist.items.map((item, i) => (
                                            <div key={i} className={`flex items-center gap-2 text-xs p-1.5 rounded bg-background/50 border border-border/50 ${CONDITION_COLORS[item.condition]}`}>
                                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                <span className="flex-1 opacity-90">{item.label}:</span>
                                                <strong className="uppercase">{item.condition}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Return checklist */}
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                <h2 className="mb-3 font-medium text-foreground">Inspección de Devolución</h2>
                                <div className="space-y-3">
                                    {data.items.map((item, i) => (
                                        <div key={i} className={`rounded-lg border border-border p-3 transition-colors ${item.condition !== 'ok' ? 'border-destructive/20 bg-destructive/5' : 'bg-muted/20'}`}>
                                            <div className="mb-2 flex items-center gap-2">
                                                <Package className="h-4 w-4 text-primary" />
                                                <span className="font-medium text-sm text-foreground">{item.label}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 mb-2">
                                                {CONDITIONS.map((c) => {
                                                    const Icon = c.icon;
                                                    return (
                                                        <button key={c.value} type="button"
                                                            onClick={() => updateItem(i, 'condition', c.value)}
                                                            className={`rounded-lg border-2 py-2 text-sm font-bold transition-all ${item.condition === c.value ? c.color : 'border-border bg-background text-muted-foreground hover:bg-accent'}`}>
                                                            {item.condition === c.value && <Icon className="mr-1 inline h-4 w-4" />}
                                                            {c.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <input type="text" placeholder="Notas sobre el estado..."
                                                value={item.notes} onChange={(e) => updateItem(i, 'notes', e.target.value)}
                                                className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-4">
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                                <h2 className="mb-2 font-medium text-sm text-foreground">Depósito de Garantía</h2>
                                <p className="text-2xl font-bold text-foreground">{fmt(order.deposit_amount)}</p>
                                <p className={`mt-1 text-xs font-semibold uppercase tracking-wider ${data.deposit_status === 'applied' ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {data.deposit_status === 'applied' ? 'Será aplicado a daños' : 'Será liberado al cliente'}
                                </p>
                            </div>

                            {data.damage_charges > 0 && (
                                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 animate-in zoom-in-95 duration-200">
                                    <h2 className="mb-1 font-semibold text-sm text-destructive uppercase tracking-tight">Cargos por Daños</h2>
                                    <p className="text-xl font-bold text-destructive">{fmt(data.damage_charges)}</p>
                                </div>
                            )}

                            <button type="submit" disabled={processing}
                                className="w-full rounded-lg bg-amber-500 py-2.5 text-sm font-bold text-white hover:bg-amber-400 dark:bg-amber-600 dark:hover:bg-amber-500 transition-colors shadow-sm disabled:opacity-50 uppercase tracking-wide">
                                {processing ? 'Registrando...' : 'Confirmar Devolución'}
                            </button>
                            <button type="button" onClick={() => router.visit(`/rentals/${order.id}`)}
                                className="w-full rounded-lg border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
