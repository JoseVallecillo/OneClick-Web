import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Planes de Pago', href: '/realestate/payment-plans' }];
const fmt = (n?: string | null) => n ? Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 }) : '—';
const TYPE_LABELS: Record<string,string> = { cash:'Contado', installments:'Cuotas', financing:'Financiamiento', mixed:'Mixto' };

interface Plan {
    id: number;
    type: string;
    total_amount: string;
    down_payment: string;
    installment_count: number;
    installments_count: number;
    paid_count: number;
    deal: { id: number; reference: string; deal_type: string; contact: { name: string }; property: { title: string } };
    creator: { name: string };
}

interface Props {
    plans: { data: Plan[]; links: any[]; meta: any };
    filters: Record<string, string>;
}

export default function PaymentPlansIndex({ plans, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    return (
        <>
            <Head title="Planes de Pago" />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Planes de Pago</h1>
                </div>

                <div className="flex gap-2">
                    <Input placeholder="Referencia o cliente..." className="w-56"
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && router.get('/realestate/payment-plans', { search }, { preserveState: true })} />
                    <Button variant="outline" size="sm" onClick={() => router.get('/realestate/payment-plans', { search }, { preserveState: true })}>Filtrar</Button>
                </div>

                <div className="overflow-hidden rounded-lg border border-border bg-card">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Negocio</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Enganche</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Cuotas</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Pagadas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {plans.data.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                    <CreditCard className="mx-auto mb-2 h-8 w-8 opacity-40" />Sin planes de pago.
                                </td></tr>
                            ) : plans.data.map((p) => (
                                <tr key={p.id} className="cursor-pointer hover:bg-muted/30 transition-colors"
                                    onClick={() => router.visit(`/realestate/deals/${p.deal.id}`)}>
                                    <td className="px-4 py-3">
                                        <p className="font-mono text-sm font-medium text-foreground">{p.deal.reference}</p>
                                        <p className="text-xs text-muted-foreground">{p.deal.contact.name}</p>
                                        <p className="text-xs text-muted-foreground/60 line-clamp-1">{p.deal.property.title}</p>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{TYPE_LABELS[p.type]}</td>
                                    <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(p.total_amount)}</td>
                                    <td className="px-4 py-3 text-right text-muted-foreground">{fmt(p.down_payment)}</td>
                                    <td className="px-4 py-3 text-center text-muted-foreground">{p.installment_count}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`font-medium ${p.paid_count === p.installment_count ? 'text-emerald-600' : 'text-foreground'}`}>
                                            {p.paid_count}/{p.installment_count}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {plans.links && (
                    <div className="flex justify-center gap-1">
                        {plans.links.map((link: any, i: number) => (
                            <button key={i} disabled={!link.url}
                                onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                className={`rounded px-3 py-1 text-sm ${link.active ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-accent text-muted-foreground'} disabled:opacity-40`}
                                dangerouslySetInnerHTML={{ __html: link.label }} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

PaymentPlansIndex.layout = (page: React.ReactNode) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
