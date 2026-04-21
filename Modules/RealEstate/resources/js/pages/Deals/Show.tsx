import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, FileText, Upload } from 'lucide-react';
import { useState } from 'react';

const WORKFLOW = ['draft','reserved','documents','contract','closing','completed'];
const STATUS_LABELS: Record<string,string> = { draft:'Borrador', reserved:'Reservado', documents:'Documentos', contract:'Contrato', closing:'Cierre', completed:'Completado', cancelled:'Cancelado' };
const STATUS_COLORS: Record<string,string> = {
    draft:'bg-secondary text-secondary-foreground', reserved:'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    documents:'bg-amber-500/20 text-amber-600 dark:text-amber-400', contract:'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    closing:'bg-orange-500/20 text-orange-600 dark:text-orange-400', completed:'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    cancelled:'bg-muted text-muted-foreground',
};
const DOC_LABELS: Record<string,string> = { dni:'DNI/Pasaporte', income_proof:'Comprobante Ingresos', tax_id:'RTN/ID Fiscal', bank_statement:'Estado de Cuenta', contract:'Contrato', other:'Otro' };
const fmt = (n?: string | null) => n ? Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 }) : '—';
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('es-HN') : '—';

interface Doc { id: number; type: string; name: string; path: string; status: string; notes?: string; uploader: { name: string }; reviewed_at?: string }
interface Installment { id: number; number: number; amount: string; due_date: string; status: string; paid_at?: string; payment_reference?: string }
interface Deal {
    id: number; reference: string; deal_type: string; status: string;
    reservation_amount: string; reservation_paid: boolean; reservation_date?: string;
    agreed_price?: string; currency: string; rent_period?: string; start_date?: string; end_date?: string;
    contract_generated: boolean; contract_signed: boolean; contract_signed_at?: string;
    notes?: string; internal_notes?: string;
    property: { id: number; reference: string; title: string; type: string; media: any[] };
    contact: { name: string };
    lead?: { id: number; reference: string; name: string };
    agent?: { name: string };
    creator: { name: string };
    documents: Doc[];
    payment_plan?: { id: number; type: string; total_amount: string; installment_count: number; installments: Installment[] };
    commissions: { id: number; agent: { name: string }; commission_pct: string; commission_amount: string; status: string }[];
}

export default function DealShow({ deal }: { deal: Deal }) {
    const [showReserve, setShowReserve] = useState(false);
    const [showCancel, setShowCancel] = useState(false);
    const currentStep = WORKFLOW.indexOf(deal.status);

    const { post: reserve, data: resData, setData: setResData, processing: resProcessing } = useForm({ reservation_amount: '', reservation_date: new Date().toISOString().slice(0,10), reservation_paid: false });
    const { post: cancel, data: canData, setData: setCanData, processing: canProcessing } = useForm({ cancellation_reason: '' });
    const { post: complete, processing: completeProcessing } = useForm({});
    const { post: contract, data: ctData, setData: setCtData, processing: ctProcessing } = useForm({ contract_signed: false });

    return (
        <>
            <Head title={`Negocio ${deal.reference}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.visit('/realestate/deals')} className="rounded p-1 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold font-mono">{deal.reference}</h1>
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[deal.status]}`}>{STATUS_LABELS[deal.status]}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{deal.contact.name} · {deal.deal_type === 'sale' ? 'Venta' : 'Arrendamiento'}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {deal.status === 'draft' && (
                            <>
                                <button onClick={() => router.visit(`/realestate/deals/${deal.id}/edit`)}
                                    className="rounded border border-border bg-card px-3 py-1.5 text-sm hover:bg-accent transition-colors">Editar</button>
                                <button onClick={() => setShowReserve(true)}
                                    className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 transition-colors">Reservar</button>
                            </>
                        )}
                        {deal.status === 'closing' && (
                            <button onClick={() => complete(`/realestate/deals/${deal.id}/complete`, { method: 'post' })} disabled={completeProcessing}
                                className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-500 transition-colors">Completar Negocio</button>
                        )}
                        {!['completed','cancelled'].includes(deal.status) && (
                            <button onClick={() => setShowCancel(true)}
                                className="rounded border border-destructive/20 bg-destructive/5 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors">Cancelar</button>
                        )}
                    </div>
                </div>

                {/* Reserve panel */}
                {showReserve && (
                    <form onSubmit={(e) => { e.preventDefault(); reserve(`/realestate/deals/${deal.id}/reserve`, { onSuccess: () => setShowReserve(false) }); }}
                        className="flex flex-wrap items-end gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                        <div><label className="text-xs text-blue-700 dark:text-blue-300">Monto Reserva</label><input type="number" value={resData.reservation_amount} onChange={(e) => setResData('reservation_amount', e.target.value)} className="mt-0.5 block rounded border border-input bg-background px-2 py-1 text-sm w-36" /></div>
                        <div><label className="text-xs text-blue-700 dark:text-blue-300">Fecha</label><input type="date" value={resData.reservation_date} onChange={(e) => setResData('reservation_date', e.target.value)} className="mt-0.5 block rounded border border-input bg-background px-2 py-1 text-sm" /></div>
                        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={resData.reservation_paid} onChange={(e) => setResData('reservation_paid', e.target.checked)} />Pago recibido</label>
                        <button type="submit" disabled={resProcessing} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white">Guardar</button>
                        <button type="button" onClick={() => setShowReserve(false)} className="text-sm text-muted-foreground">Cancelar</button>
                    </form>
                )}

                {/* Cancel panel */}
                {showCancel && (
                    <form onSubmit={(e) => { e.preventDefault(); cancel(`/realestate/deals/${deal.id}/cancel`, { onSuccess: () => setShowCancel(false) }); }}
                        className="flex flex-wrap items-end gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                        <div className="flex-1"><label className="text-xs text-destructive">Motivo de cancelación</label><input type="text" value={canData.cancellation_reason} onChange={(e) => setCanData('cancellation_reason', e.target.value)} className="mt-0.5 block w-full rounded border border-input bg-background px-2 py-1 text-sm" /></div>
                        <button type="submit" disabled={canProcessing} className="rounded bg-destructive px-3 py-1.5 text-sm text-destructive-foreground">Confirmar</button>
                        <button type="button" onClick={() => setShowCancel(false)} className="text-sm text-muted-foreground">Volver</button>
                    </form>
                )}

                {/* Workflow */}
                {deal.status !== 'cancelled' && (
                    <div className="flex items-center rounded-lg border border-border bg-card p-4 shadow-sm">
                        {WORKFLOW.map((step, i) => (
                            <div key={step} className="flex flex-1 items-center">
                                <div className="flex flex-col items-center">
                                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${i < currentStep ? 'bg-primary text-primary-foreground' : i === currentStep ? 'ring-2 ring-primary bg-background text-primary' : 'border border-border bg-muted text-muted-foreground'}`}>
                                        {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                                    </div>
                                    <span className={`mt-1 text-[10px] font-medium uppercase tracking-wider ${i === currentStep ? 'text-primary' : 'text-muted-foreground'}`}>{STATUS_LABELS[step]}</span>
                                </div>
                                {i < WORKFLOW.length - 1 && <div className={`mx-1 h-0.5 flex-1 rounded-full ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />}
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-4">
                        {/* Deal info */}
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <h2 className="mb-3 font-medium">Detalles del Negocio</h2>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                <div><span className="text-muted-foreground">Propiedad:</span> <span className="font-medium cursor-pointer text-primary hover:underline" onClick={() => router.visit(`/realestate/properties/${deal.property.id}`)}>{deal.property.title}</span></div>
                                <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{deal.contact.name}</span></div>
                                {deal.agreed_price && <div><span className="text-muted-foreground">Precio acordado:</span> <span className="font-bold text-primary">{deal.currency} {fmt(deal.agreed_price)}</span></div>}
                                {deal.reservation_amount && parseFloat(deal.reservation_amount) > 0 && (
                                    <div><span className="text-muted-foreground">Reserva:</span> <span className="font-medium">{deal.currency} {fmt(deal.reservation_amount)} {deal.reservation_paid ? '✓ Pagada' : '— Pendiente'}</span></div>
                                )}
                                {deal.start_date && <div><span className="text-muted-foreground">Inicio:</span> <span className="font-medium">{fmtDate(deal.start_date)}</span></div>}
                                {deal.end_date && <div><span className="text-muted-foreground">Fin:</span> <span className="font-medium">{fmtDate(deal.end_date)}</span></div>}
                                <div><span className="text-muted-foreground">Contrato:</span> <span className={`font-medium ${deal.contract_signed ? 'text-emerald-600' : 'text-muted-foreground/60'}`}>{deal.contract_signed ? `Firmado ${fmtDate(deal.contract_signed_at)}` : deal.contract_generated ? 'Generado, pendiente firma' : 'No generado'}</span></div>
                                <div><span className="text-muted-foreground">Agente:</span> <span className="font-medium">{deal.agent?.name ?? '—'}</span></div>
                            </div>
                            {/* Contract action */}
                            {['documents','contract'].includes(deal.status) && (
                                <form onSubmit={(e) => { e.preventDefault(); contract(`/realestate/deals/${deal.id}/contract`, { onSuccess: () => {} }); }} className="mt-3 flex items-center gap-3 border-t border-border pt-3">
                                    <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={ctData.contract_signed} onChange={(e) => setCtData('contract_signed', e.target.checked)} />Contrato firmado</label>
                                    <button type="submit" disabled={ctProcessing} className="rounded bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-500">Generar Contrato</button>
                                </form>
                            )}
                        </div>

                        {/* Documents */}
                        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="font-medium">Documentación</h2>
                                <button onClick={() => router.visit(`/realestate/deals/${deal.id}/edit`)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                    <Upload className="h-3 w-3" />Subir documento
                                </button>
                            </div>
                            {deal.documents.length === 0
                                ? <p className="text-sm text-muted-foreground">No hay documentos subidos.</p>
                                : <div className="space-y-2">
                                    {deal.documents.map((d) => (
                                        <div key={d.id} className="flex items-center justify-between rounded border border-border p-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="font-medium text-foreground">{d.name}</p>
                                                    <p className="text-xs text-muted-foreground">{DOC_LABELS[d.type]} · {d.uploader.name}</p>
                                                </div>
                                            </div>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${{ pending:'bg-amber-500/20 text-amber-600', approved:'bg-emerald-500/20 text-emerald-600', rejected:'bg-destructive/20 text-destructive' }[d.status]}`}>
                                                {{ pending:'Pendiente', approved:'Aprobado', rejected:'Rechazado' }[d.status]}
                                            </span>
                                        </div>
                                    ))}
                                </div>}
                        </div>

                        {/* Payment plan */}
                        {deal.payment_plan && (
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                <h2 className="mb-3 font-medium">Plan de Pagos</h2>
                                <div className="mb-3 text-sm">
                                    <span className="text-muted-foreground">Total:</span> <span className="font-bold">{deal.currency} {fmt(deal.payment_plan.total_amount)}</span>
                                    <span className="mx-3 text-muted-foreground">·</span>
                                    <span className="text-muted-foreground">{deal.payment_plan.installment_count} cuotas</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="border-b border-border bg-muted/50">
                                            <tr><th className="px-2 py-1.5 text-left text-muted-foreground">#</th><th className="px-2 py-1.5 text-right text-muted-foreground">Monto</th><th className="px-2 py-1.5 text-center text-muted-foreground">Vence</th><th className="px-2 py-1.5 text-center text-muted-foreground">Estado</th></tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {deal.payment_plan.installments.map((inst) => (
                                                <tr key={inst.id} className="hover:bg-muted/20">
                                                    <td className="px-2 py-1.5 text-muted-foreground">{inst.number}</td>
                                                    <td className="px-2 py-1.5 text-right font-medium">{fmt(inst.amount)}</td>
                                                    <td className="px-2 py-1.5 text-center text-muted-foreground">{fmtDate(inst.due_date)}</td>
                                                    <td className="px-2 py-1.5 text-center">
                                                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${{ pending:'bg-amber-500/20 text-amber-600', paid:'bg-emerald-500/20 text-emerald-600', overdue:'bg-destructive/20 text-destructive', cancelled:'bg-muted text-muted-foreground' }[inst.status]}`}>
                                                            {{ pending:'Pendiente', paid:'Pagado', overdue:'Vencido', cancelled:'Cancelado' }[inst.status]}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Commission summary */}
                        {deal.commissions.length > 0 && (
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                <h2 className="mb-2 text-sm font-medium">Comisiones</h2>
                                {deal.commissions.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between text-sm py-1">
                                        <span className="text-foreground/90">{c.agent.name}</span>
                                        <div className="text-right">
                                            <p className="font-medium">{fmt(c.commission_amount)}</p>
                                            <p className="text-xs text-muted-foreground">{c.commission_pct}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {deal.notes && (
                            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                                <h2 className="mb-1 text-sm font-medium">Notas</h2>
                                <p className="text-sm text-foreground/80">{deal.notes}</p>
                            </div>
                        )}
                        {deal.internal_notes && (
                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                                <strong>Notas internas:</strong> {deal.internal_notes}
                            </div>
                        )}
                        <button onClick={() => router.visit(`/realestate/payment-plans?deal_id=${deal.id}`)}
                            className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-accent transition-colors">Ver Plan de Pagos</button>
                        <button onClick={() => router.visit(`/realestate/commissions?deal_id=${deal.id}`)}
                            className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-accent transition-colors">Ver Comisiones</button>
                    </div>
                </div>
            </div>
        </>
    );
}

DealShow.layout = (page: React.ReactNode) => {
    const d = (page as any).props.deal;
    const bc: BreadcrumbItem[] = [
        { title: 'Negocios', href: '/realestate/deals' },
        { title: d.reference, href: `/realestate/deals/${d.id}` },
    ];
    return <AppLayout breadcrumbs={bc}>{page}</AppLayout>;
};
