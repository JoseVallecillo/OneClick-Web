import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Contact { id: number; name: string; }
interface CommRow {
    id: number; type: string; subject: string|null; content: string;
    communication_date: string; outcome: string|null; follow_up_date: string|null;
    follow_up_type: string|null; user?: { name: string };
}
interface Paginated { data: CommRow[]; links: { url: string|null; label: string; active: boolean }[]; total?: number; }
interface Props { contact: Contact; communications: Paginated; }

const TYPES:    Record<string, string> = { call: 'Llamada', email: 'Email', meeting: 'Reunión', note: 'Nota' };
const OUTCOMES: Record<string, string> = { positive: 'Positivo', negative: 'Negativo', neutral: 'Neutral', follow_up_needed: 'Seguimiento' };
const OUTCOME_COLORS: Record<string, string> = { positive: 'text-green-600', negative: 'text-red-600', neutral: 'text-muted-foreground', follow_up_needed: 'text-amber-600' };

function CommForm({ contactId, onCancel }: { contactId: number; onCancel: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'call', subject: '', content: '',
        communication_date: new Date().toISOString().slice(0, 10),
        outcome: '', follow_up_date: '', follow_up_type: '',
    });
    function submit(e: React.FormEvent) {
        e.preventDefault();
        post(`/contacts/${contactId}/communications`, { onSuccess: () => { reset(); onCancel(); } });
    }
    return (
        <form onSubmit={submit} className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-4 mb-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-1.5">
                    <Label>Tipo *</Label>
                    <Select value={data.type} onValueChange={v => setData('type', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(TYPES).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5"><Label>Fecha *</Label><Input type="date" value={data.communication_date} onChange={e => setData('communication_date', e.target.value)} /></div>
                <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>Asunto</Label><Input placeholder="Reunión de seguimiento…" value={data.subject} onChange={e => setData('subject', e.target.value)} /></div>
                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-4">
                    <Label>Contenido *</Label>
                    <textarea className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                        placeholder="Detalle de la comunicación…" value={data.content} onChange={e => setData('content', e.target.value)} rows={3} />
                    {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Resultado</Label>
                    <Select value={data.outcome} onValueChange={v => setData('outcome', v)}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Sin resultado</SelectItem>
                            {Object.entries(OUTCOMES).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5"><Label>Fecha seguimiento</Label><Input type="date" value={data.follow_up_date} onChange={e => setData('follow_up_date', e.target.value)} /></div>
                <div className="flex flex-col gap-1.5">
                    <Label>Tipo seguimiento</Label>
                    <Select value={data.follow_up_type} onValueChange={v => setData('follow_up_type', v)}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Ninguno</SelectItem>
                            <SelectItem value="call">Llamada</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="meeting">Reunión</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={processing}>{processing ? <><Spinner className="mr-1 h-3 w-3" />Guardando…</> : 'Registrar comunicación'}</Button>
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
            </div>
        </form>
    );
}

export default function CommunicationsIndex({ contact, communications }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const [showForm, setShowForm] = useState(false);

    function del(id: number) {
        if (!confirm('¿Eliminar esta comunicación?')) return;
        router.delete(`/contacts/${contact.id}/communications/${id}`, { preserveScroll: true });
    }

    return (
        <>
            <Head title={`Comunicaciones — ${contact.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <Link href={`/contacts/${contact.id}/edit`}>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />{contact.name}
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">Historial de comunicaciones</h1>
                </div>

                {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>}
                {flash?.error   && <div className="rounded-lg border border-red-200   bg-red-50   px-4 py-3 text-sm text-red-800">{flash.error}</div>}

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MessageSquare className="h-4 w-4" />Comunicaciones
                                {communications.total !== undefined && <Badge variant="secondary" className="ml-1">{communications.total}</Badge>}
                            </CardTitle>
                            {!showForm && <Button size="sm" className="flex items-center gap-1.5" onClick={() => setShowForm(true)}><Plus className="h-3.5 w-3.5" />Registrar</Button>}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {showForm && <CommForm contactId={contact.id} onCancel={() => setShowForm(false)} />}

                        {communications.data.length === 0 && !showForm ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                                <MessageSquare className="h-8 w-8 opacity-30" />
                                <p className="text-sm">Sin comunicaciones registradas.</p>
                                <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>Registrar primera comunicación</Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {communications.data.map(comm => (
                                    <div key={comm.id} className="rounded-lg border p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="outline">{TYPES[comm.type] ?? comm.type}</Badge>
                                                    {comm.outcome && (
                                                        <span className={`text-xs font-medium ${OUTCOME_COLORS[comm.outcome] ?? ''}`}>
                                                            {OUTCOMES[comm.outcome] ?? comm.outcome}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-muted-foreground">{comm.communication_date}</span>
                                                    {comm.user && <span className="text-xs text-muted-foreground">por {comm.user.name}</span>}
                                                </div>
                                                {comm.subject && <p className="text-sm font-medium mt-1">{comm.subject}</p>}
                                                <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">{comm.content}</p>
                                                {comm.follow_up_date && (
                                                    <p className="text-xs text-amber-600 mt-1">
                                                        Seguimiento: {comm.follow_up_date}
                                                        {comm.follow_up_type && ` — ${TYPES[comm.follow_up_type]}`}
                                                    </p>
                                                )}
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive shrink-0" onClick={() => del(comm.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {/* Paginación */}
                                {communications.links.length > 3 && (
                                    <div className="flex justify-center gap-1 pt-2">
                                        {communications.links.map((link, i) => (
                                            <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm"
                                                className="h-7 min-w-[28px] px-2 text-xs"
                                                disabled={!link.url || link.active}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                                                dangerouslySetInnerHTML={{ __html: link.label }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CommunicationsIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contactos', href: '/contacts' },
        { title: 'Comunicaciones', href: '#' },
    ],
};
