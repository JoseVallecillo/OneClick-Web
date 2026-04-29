import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Star } from 'lucide-react';

interface Contact { id: number; name: string; }
interface Evaluation {
    quality_rating: number; delivery_rating: number;
    communication_rating: number; price_rating: number;
    on_time_delivery_percent: number; defect_rate: number;
    average_delivery_days: number|null; notes: string|null;
    overall_rating: number; last_evaluation_date: string|null;
}
interface Props { contact: Contact; evaluation: Evaluation|null; }

function StarInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex flex-col gap-2">
            <Label>{label}</Label>
            <div className="flex gap-1">
                {[1,2,3,4,5].map(i => (
                    <button key={i} type="button" onClick={() => onChange(i)}
                        className={`h-8 w-8 rounded transition-colors ${i <= value ? 'text-amber-400 hover:text-amber-300' : 'text-muted-foreground/30 hover:text-amber-200'}`}>
                        <Star className="h-7 w-7 fill-current" />
                    </button>
                ))}
                <span className="ml-2 self-center text-sm text-muted-foreground">{value}/5</span>
            </div>
        </div>
    );
}

export default function SupplierEvaluationPage({ contact, evaluation }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const { data, setData, post, processing, errors } = useForm({
        quality_rating:           evaluation?.quality_rating           ?? 3,
        delivery_rating:          evaluation?.delivery_rating          ?? 3,
        communication_rating:     evaluation?.communication_rating     ?? 3,
        price_rating:             evaluation?.price_rating             ?? 3,
        on_time_delivery_percent: evaluation?.on_time_delivery_percent ?? 0,
        defect_rate:              evaluation?.defect_rate              ?? 0,
        average_delivery_days:    evaluation?.average_delivery_days    ?? '',
        notes:                    evaluation?.notes                    ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/contacts/${contact.id}/supplier-evaluation`);
    }

    const overallPreview = ((data.quality_rating + data.delivery_rating + data.communication_rating + data.price_rating) / 4).toFixed(1);

    return (
        <>
            <Head title={`Evaluación — ${contact.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <Link href={`/contacts/${contact.id}/edit`}>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />{contact.name}
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">Evaluación de Proveedor</h1>
                </div>

                {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>}
                {flash?.error   && <div className="rounded-lg border border-red-200   bg-red-50   px-4 py-3 text-sm text-red-800">{flash.error}</div>}

                <form onSubmit={submit} className="flex flex-col gap-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Ratings */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader className="pb-3"><CardTitle className="text-base">Calificaciones (1 a 5 estrellas)</CardTitle></CardHeader>
                                <CardContent className="grid gap-6 sm:grid-cols-2">
                                    <StarInput label="Calidad del producto/servicio" value={data.quality_rating} onChange={v => setData('quality_rating', v)} />
                                    <StarInput label="Cumplimiento de entregas" value={data.delivery_rating} onChange={v => setData('delivery_rating', v)} />
                                    <StarInput label="Comunicación y soporte" value={data.communication_rating} onChange={v => setData('communication_rating', v)} />
                                    <StarInput label="Relación precio/calidad" value={data.price_rating} onChange={v => setData('price_rating', v)} />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Preview rating */}
                        <Card className="flex flex-col items-center justify-center p-6 gap-2">
                            <p className="text-sm text-muted-foreground">Rating general</p>
                            <div className="text-6xl font-bold text-amber-500">{overallPreview}</div>
                            <div className="flex gap-1">
                                {[1,2,3,4,5].map(i => (
                                    <Star key={i} className={`h-5 w-5 fill-current ${i <= Math.round(parseFloat(overallPreview)) ? 'text-amber-400' : 'text-muted-foreground/20'}`} />
                                ))}
                            </div>
                            {evaluation?.last_evaluation_date && (
                                <p className="text-xs text-muted-foreground mt-2">Última eval.: {evaluation.last_evaluation_date}</p>
                            )}
                        </Card>
                    </div>

                    {/* Métricas */}
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Métricas operativas</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="on_time">Entregas a tiempo (%)</Label>
                                <Input id="on_time" type="number" min="0" max="100" step="0.1"
                                    value={data.on_time_delivery_percent}
                                    onChange={e => setData('on_time_delivery_percent', parseFloat(e.target.value) || 0)} />
                                {errors.on_time_delivery_percent && <p className="text-xs text-destructive">{errors.on_time_delivery_percent}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="defect">Tasa de defectos (%)</Label>
                                <Input id="defect" type="number" min="0" max="100" step="0.1"
                                    value={data.defect_rate}
                                    onChange={e => setData('defect_rate', parseFloat(e.target.value) || 0)} />
                                {errors.defect_rate && <p className="text-xs text-destructive">{errors.defect_rate}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="avg_days">Días promedio de entrega</Label>
                                <Input id="avg_days" type="number" min="1" placeholder="7"
                                    value={data.average_delivery_days ?? ''}
                                    onChange={e => setData('average_delivery_days', e.target.value ? parseInt(e.target.value) : '')} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notas */}
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Notas de evaluación</CardTitle></CardHeader>
                        <CardContent>
                            <textarea className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                                placeholder="Observaciones sobre el proveedor, áreas de mejora, puntos fuertes…"
                                value={data.notes} onChange={e => setData('notes', e.target.value)} rows={4} />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Link href={`/contacts/${contact.id}/edit`}><Button type="button" variant="outline">Cancelar</Button></Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? <><Spinner className="mr-1" />Guardando…</> : evaluation ? 'Actualizar evaluación' : 'Guardar evaluación'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

SupplierEvaluationPage.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contactos', href: '/contacts' },
        { title: 'Evaluación de Proveedor', href: '#' },
    ],
};
