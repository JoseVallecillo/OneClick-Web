import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { ArrowLeft, Camera, CheckCircle2, Package } from 'lucide-react';

interface Line {
    id: number;
    qty: string;
    product: { id: number; name: string; sku: string };
    lot?: { lot_number: string } | null;
}

interface Order {
    id: number; reference: string; customer: { name: string };
    start_date: string; end_date: string; lines: Line[];
}

interface Props { order: Order }

const CONDITIONS = [
    { value: 'ok',      label: 'OK',      color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    { value: 'damaged', label: 'Dañado',  color: 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    { value: 'missing', label: 'Faltante', color: 'border-destructive/50 bg-destructive/10 text-destructive' },
];

export default function RentalDeliver({ order }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Alquileres', href: '/rentals' },
        { title: order.reference, href: `/rentals/${order.id}` },
        { title: 'Registrar Entrega', href: '#' },
    ];

    const { data, setData, post, processing, errors } = useForm({
        delivered_at:      new Date().toISOString().split('T')[0],
        contract_signed:   false as boolean,
        deposit_status:    'held',
        overall_condition: 'good',
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
        setData('items', items);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/rentals/${order.id}/deliver`);
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
                            <h1 className="text-xl font-semibold text-foreground">Checklist de Entrega</h1>
                            <p className="text-sm text-muted-foreground">{order.reference} — {order.customer.name}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-4">
                            {/* Delivery info */}
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                <h2 className="mb-3 font-medium text-foreground">Datos de Entrega</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha de entrega *</label>
                                        <input type="date" value={data.delivered_at}
                                            onChange={(e) => setData('delivered_at', e.target.value)}
                                            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Estado del depósito</label>
                                        <select value={data.deposit_status} onChange={(e) => setData('deposit_status', e.target.value)}
                                            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                                            <option value="none">Sin depósito</option>
                                            <option value="pending">Pendiente de cobro</option>
                                            <option value="held">Retenido / Cobrado</option>
                                        </select>
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
                                    <div className="flex items-center gap-2 pt-4">
                                        <input type="checkbox" id="contract_signed" checked={data.contract_signed}
                                            onChange={(e) => setData('contract_signed', e.target.checked)}
                                            className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-primary" />
                                        <label htmlFor="contract_signed" className="text-sm font-medium text-foreground">
                                            Contrato firmado por el cliente
                                        </label>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="mb-1 block text-xs font-medium text-muted-foreground">Observaciones generales</label>
                                        <textarea rows={2} value={data.notes} onChange={(e) => setData('notes', e.target.value)}
                                            className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                    </div>
                                </div>
                            </div>

                            {/* Item checklist */}
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                <h2 className="mb-3 font-medium text-foreground">Inspección por Equipo</h2>
                                <div className="space-y-3">
                                    {data.items.map((item, i) => (
                                        <div key={i} className="rounded-lg border border-border bg-muted/20 p-3">
                                            <div className="mb-2 flex items-center gap-2">
                                                <Package className="h-4 w-4 text-primary" />
                                                <span className="font-medium text-sm text-foreground">{item.label}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 mb-2">
                                                {CONDITIONS.map((c) => (
                                                    <button key={c.value} type="button"
                                                        onClick={() => updateItem(i, 'condition', c.value)}
                                                        className={`rounded-lg border-2 py-2 text-sm font-bold transition-all ${item.condition === c.value ? c.color : 'border-border bg-background text-muted-foreground hover:bg-accent'}`}>
                                                        {item.condition === c.value && <CheckCircle2 className="mr-1 inline h-4 w-4" />}
                                                        {c.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <input type="text" placeholder="Notas adicionales..."
                                                value={item.notes} onChange={(e) => updateItem(i, 'notes', e.target.value)}
                                                className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="space-y-4">
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                <h2 className="mb-2 font-medium text-sm text-foreground">Período de Alquiler</h2>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(order.start_date).toLocaleDateString('es-HN')}
                                    {' → '}
                                    {new Date(order.end_date).toLocaleDateString('es-HN')}
                                </p>
                                <p className="mt-2 text-xs text-muted-foreground/60">{order.lines.length} equipos en esta reserva</p>
                            </div>

                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-400">
                                <strong className="font-bold">Recordatorio:</strong> Asegúrate de que el cliente revise y firme el contrato antes de llevarse los equipos.
                            </div>

                            <button type="submit" disabled={processing}
                                className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm disabled:opacity-50">
                                {processing ? 'Registrando...' : 'Confirmar Entrega'}
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
