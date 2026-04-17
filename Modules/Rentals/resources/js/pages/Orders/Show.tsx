import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CalendarCheck,
    CheckCircle2,
    ClipboardList,
    Package,
    RefreshCw,
    Shield,
    Truck,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

const STATUS_LABELS: Record<string, string> = {
    draft: 'Borrador', confirmed: 'Confirmado', active: 'Activo',
    returned: 'Devuelto', invoiced: 'Facturado', closed: 'Cerrado',
};
const STATUS_COLORS: Record<string, string> = {
    draft:     'bg-secondary text-secondary-foreground',
    confirmed: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    active:    'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    returned:  'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    invoiced:  'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    closed:    'bg-muted text-muted-foreground',
};
const CONDITION_LABELS: Record<string, string> = {
    excellent: 'Excelente', good: 'Bueno', fair: 'Regular', poor: 'Malo',
};
const RATE_LABELS: Record<string, string> = {
    hourly: '/hr', daily: '/día', weekly: '/sem', monthly: '/mes',
};

const fmt = (n: string | number) =>
    Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('es-HN') : '—';
const fmtDateTime = (d?: string | null) => d ? new Date(d).toLocaleString('es-HN') : '—';

interface ChecklistItem {
    id: number;
    label: string;
    condition: 'ok' | 'damaged' | 'missing';
    notes?: string;
    photo_path?: string;
    order_line: { product: { name: string } };
}

interface Checklist {
    id: number;
    type: string;
    overall_condition: string;
    notes?: string;
    technician: { name: string };
    items: ChecklistItem[];
}

interface Line {
    id: number;
    description?: string;
    qty: string;
    rate_type: string;
    unit_price: string;
    duration: string;
    discount_pct: string;
    tax_rate: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    product: { id: number; name: string; sku: string };
    lot?: { id: number; lot_number: string } | null;
}

interface Order {
    id: number;
    reference: string;
    status: string;
    start_date: string;
    end_date: string;
    pickup_type: string;
    delivery_address?: string;
    deposit_amount: string;
    deposit_status: string;
    deposit_notes?: string;
    contract_signed: boolean;
    signed_at?: string;
    subtotal: string;
    tax_amount: string;
    total: string;
    damage_charges: string;
    confirmed_at?: string;
    delivered_at?: string;
    returned_at?: string;
    invoiced_at?: string;
    closed_at?: string;
    invoice_number?: string;
    notes?: string;
    internal_notes?: string;
    customer: { id: number; name: string };
    creator: { name: string };
    lines: Line[];
    delivery_checklist?: Checklist;
    return_checklist?: Checklist;
}

interface Props {
    order: Order;
}

const WORKFLOW_STEPS = ['draft', 'confirmed', 'active', 'returned', 'invoiced', 'closed'];

    return (
        <>
            <Head title={`Orden ${order.reference}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.visit('/rentals')} className="rounded p-1 hover:bg-muted transition-colors text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold font-mono text-foreground">{order.reference}</h1>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                                    {STATUS_LABELS[order.status]}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{order.customer.name}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                        {order.status === 'draft' && (
                            <>
                                <button onClick={() => router.visit(`/rentals/${order.id}/edit`)}
                                    className="rounded border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors">Editar</button>
                                <button onClick={handleConfirm}
                                    className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 transition-colors">Confirmar</button>
                                <button onClick={handleDelete}
                                    className="rounded border border-destructive/20 bg-destructive/5 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors">Eliminar</button>
                            </>
                        )}
                        {order.status === 'confirmed' && (
                            <>
                                <button onClick={() => router.visit(`/rentals/${order.id}/edit`)}
                                    className="rounded border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors">Editar</button>
                                <button onClick={() => router.visit(`/rentals/${order.id}/deliver`)}
                                    className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500 transition-colors">
                                    <Truck className="mr-1 inline h-4 w-4" />Registrar Entrega
                                </button>
                            </>
                        )}
                        {order.status === 'active' && (
                            <>
                                <button onClick={() => setShowExtend(!showExtend)}
                                    className="rounded border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors">
                                    <RefreshCw className="mr-1 inline h-4 w-4" />Extender
                                </button>
                                <button onClick={() => router.visit(`/rentals/${order.id}/return`)}
                                    className="rounded bg-amber-500 px-3 py-1.5 text-sm text-white hover:bg-amber-400 dark:bg-amber-600 dark:hover:bg-amber-500 transition-colors">
                                    <ClipboardList className="mr-1 inline h-4 w-4" />Registrar Devolución
                                </button>
                            </>
                        )}
                        {order.status === 'returned' && (
                            <button onClick={() => setShowInvoice(!showInvoice)}
                                className="rounded bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-500 transition-colors">
                                Facturar
                            </button>
                        )}
                        {order.status === 'invoiced' && (
                            <button onClick={handleClose}
                                className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 transition-colors">Cerrar</button>
                        )}
                    </div>
                </div>

                {/* Extend panel */}
                {showExtend && (
                    <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Nueva fecha fin:</span>
                        <input type="date" value={extendDate} onChange={(e) => setExtendDate(e.target.value)}
                            className="rounded border border-input bg-background px-2 py-1 text-sm text-foreground" min={order.end_date} />
                        <button onClick={handleExtend} className="rounded bg-blue-600 px-3 py-1 text-sm text-white">Guardar</button>
                        <button onClick={() => setShowExtend(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
                    </div>
                )}

                {/* Invoice panel */}
                {showInvoice && (
                    <div className="flex items-center gap-2 rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">N° Factura:</span>
                        <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
                            placeholder="FAC-2026-001" className="rounded border border-input bg-background px-2 py-1 text-sm w-48 text-foreground" />
                        <button onClick={handleInvoice} className="rounded bg-purple-600 px-3 py-1 text-sm text-white">Emitir</button>
                        <button onClick={() => setShowInvoice(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancelar</button>
                    </div>
                )}

                {/* Workflow progress */}
                <div className="flex items-center rounded-lg border border-border bg-card p-4 shadow-sm">
                    {WORKFLOW_STEPS.map((step, i) => (
                        <div key={step} className="flex flex-1 items-center">
                            <div className="flex flex-col items-center">
                                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all ${i < currentStep ? 'bg-primary text-primary-foreground' : i === currentStep ? 'ring-2 ring-primary bg-background text-primary' : 'border border-border bg-muted text-muted-foreground'}`}>
                                    {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                                </div>
                                <span className={`mt-1 text-[10px] font-medium uppercase tracking-wider ${i === currentStep ? 'text-primary' : 'text-muted-foreground'}`}>{STATUS_LABELS[step]}</span>
                            </div>
                            {i < WORKFLOW_STEPS.length - 1 && (
                                <div className={`mx-1 h-0.5 flex-1 rounded-full ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {/* Main info */}
                    <div className="col-span-2 space-y-4">
                        {/* Order details */}
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium text-foreground">Detalles de la Reserva</h2>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium text-foreground">{order.customer.name}</span></div>
                                <div><span className="text-muted-foreground">Tipo de entrega:</span> <span className="font-medium text-foreground capitalize">{order.pickup_type === 'delivery' ? 'Domicilio' : 'Local'}</span></div>
                                <div><span className="text-muted-foreground">Inicio:</span> <span className="font-medium text-foreground">{fmtDate(order.start_date)}</span></div>
                                <div><span className="text-muted-foreground">Fin:</span> <span className="font-medium text-foreground">{fmtDate(order.end_date)}</span></div>
                                {order.delivery_address && (
                                    <div className="col-span-2"><span className="text-muted-foreground">Dirección:</span> <span className="font-medium text-foreground">{order.delivery_address}</span></div>
                                )}
                                {order.invoice_number && (
                                    <div><span className="text-muted-foreground">Factura:</span> <span className="font-medium text-foreground">{order.invoice_number}</span></div>
                                )}
                                <div><span className="text-muted-foreground">Contrato:</span> <span className={`font-medium ${order.contract_signed ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/60'}`}>{order.contract_signed ? `Firmado ${fmtDateTime(order.signed_at)}` : 'Sin firmar'}</span></div>
                                <div><span className="text-muted-foreground">Creado por:</span> <span className="font-medium text-foreground">{order.creator.name}</span></div>
                            </div>
                        </div>

                        {/* Lines */}
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium text-foreground">Equipos Alquilados</h2>
                            <table className="w-full text-sm">
                                <thead className="border-b border-border bg-muted/50 rounded-t-lg">
                                    <tr className="text-muted-foreground">
                                        <th className="px-3 py-2 text-left font-medium">Equipo</th>
                                        <th className="px-3 py-2 text-left font-medium">N° Serie</th>
                                        <th className="px-3 py-2 text-center font-medium">Cant.</th>
                                        <th className="px-3 py-2 text-center font-medium">Duración</th>
                                        <th className="px-3 py-2 text-right font-medium">Precio Unit.</th>
                                        <th className="px-3 py-2 text-right font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {order.lines.map((line) => (
                                        <tr key={line.id} className="hover:bg-muted/30">
                                            <td className="px-3 py-3">
                                                <div className="font-medium text-foreground">{line.description || line.product.name}</div>
                                                <div className="text-xs text-muted-foreground/60">{line.product.sku}</div>
                                            </td>
                                            <td className="px-3 py-3 text-muted-foreground font-mono text-xs">{line.lot?.lot_number ?? '—'}</td>
                                            <td className="px-3 py-3 text-center text-foreground">{line.qty}</td>
                                            <td className="px-3 py-3 text-center text-foreground">{line.duration}{RATE_LABELS[line.rate_type]}</td>
                                            <td className="px-3 py-3 text-right text-foreground">{fmt(line.unit_price)}</td>
                                            <td className="px-3 py-3 text-right font-medium text-foreground">{fmt(line.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t border-border">
                                    <tr className="text-sm">
                                        <td colSpan={5} className="pt-3 pr-3 text-right text-muted-foreground">Subtotal</td>
                                        <td className="pt-3 text-right text-foreground">{fmt(order.subtotal)}</td>
                                    </tr>
                                    <tr className="text-sm">
                                        <td colSpan={5} className="pr-3 text-right text-muted-foreground">Impuestos</td>
                                        <td className="text-right text-foreground">{fmt(order.tax_amount)}</td>
                                    </tr>
                                    {parseFloat(order.damage_charges) > 0 && (
                                        <tr className="text-sm text-destructive font-medium">
                                            <td colSpan={5} className="pr-3 text-right">Cargos por daños</td>
                                            <td className="text-right">{fmt(order.damage_charges)}</td>
                                        </tr>
                                    )}
                                    <tr className="font-bold text-base">
                                        <td colSpan={5} className="pt-2 pr-3 text-right text-foreground">Total</td>
                                        <td className="pt-2 text-right text-primary">{fmt(parseFloat(order.total) + parseFloat(order.damage_charges))}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Checklists */}
                        {(order.delivery_checklist || order.return_checklist) && (
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                <h2 className="mb-3 font-medium text-foreground">Inspecciones</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {[order.delivery_checklist, order.return_checklist].map((cl, i) => cl && (
                                        <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="font-semibold text-sm text-foreground">{cl.type === 'delivery' ? 'Entrega' : 'Devolución'}</span>
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">{CONDITION_LABELS[cl.overall_condition]}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {cl.items.map((item) => (
                                                    <div key={item.id} className="flex items-center gap-2 text-xs">
                                                        {item.condition === 'ok'
                                                            ? <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                                                            : item.condition === 'damaged'
                                                            ? <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                                            : <XCircle className="h-3 w-3 text-destructive shrink-0" />}
                                                        <span className="text-foreground/90">{item.label}</span>
                                                        {item.notes && <span className="text-muted-foreground/60">— {item.notes}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                            {cl.notes && <p className="mt-2 text-xs text-muted-foreground">{cl.notes}</p>}
                                            <p className="mt-1 text-[10px] text-muted-foreground/40 italic">Técnico: {cl.technician.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {(order.notes || order.internal_notes) && (
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                <h2 className="mb-3 font-medium text-foreground">Notas</h2>
                                {order.notes && <p className="mb-2 text-sm text-foreground/80">{order.notes}</p>}
                                {order.internal_notes && (
                                    <div className="rounded border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
                                        <strong className="underline decoration-amber-500/40">Internas:</strong> {order.internal_notes}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Deposit */}
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="mb-2 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary" />
                                <h2 className="font-medium text-sm text-foreground">Depósito de Garantía</h2>
                            </div>
                            <p className="text-2xl font-bold text-foreground">{fmt(order.deposit_amount)}</p>
                            <p className={`mt-1 text-sm font-semibold ${depositStatusColors[order.deposit_status]}`}>
                                {depositStatusLabels[order.deposit_status]}
                            </p>
                            {order.deposit_notes && <p className="mt-1 text-xs text-muted-foreground/60">{order.deposit_notes}</p>}
                        </div>

                        {/* Timeline */}
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium text-sm text-foreground">Cronología</h2>
                            <div className="space-y-3 text-xs">
                                {[
                                    ['Creado', order.created_at],
                                    ['Confirmado', order.confirmed_at],
                                    ['Entregado', order.delivered_at],
                                    ['Devuelto', order.returned_at],
                                    ['Facturado', order.invoiced_at],
                                    ['Cerrado', order.closed_at],
                                ].map(([label, date]) => date && (
                                    <div key={label as string} className="flex flex-col border-l-2 border-primary/20 pl-3 relative">
                                        <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-primary" />
                                        <span className="text-muted-foreground font-medium uppercase tracking-tighter text-[9px]">{label}</span>
                                        <span className="text-foreground/90 font-mono">{fmtDateTime(date as string)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

RentalShow.layout = (page: React.ReactNode) => {
    const order = (page as any).props.order;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Alquileres', href: '/rentals' },
        { title: order.reference, href: `/rentals/${order.id}` },
    ];
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
