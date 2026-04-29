import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import { Head, Link, router } from '@inertiajs/react';
import { MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface ContactActivity {
    id: number; name: string;
    communication_count: number; last_communication: string|null;
    communication_types: Record<string, number>;
}
interface Props {
    contacts: ContactActivity[];
    filters: { from: string; to: string };
}

const TYPES: Record<string, string> = { call: 'Llamadas', email: 'Emails', meeting: 'Reuniones', note: 'Notas' };

export default function CommunicationActivityReport({ contacts, filters }: Props) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo]     = useState(filters.to);

    function apply() {
        router.get('/contacts/reports/communications', { from, to });
    }

    return (
        <>
            <Head title="Actividad de Comunicaciones" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-3">
                    <Link href="/contacts"><Button variant="ghost" size="sm" className="pl-1">← Contactos</Button></Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" />Actividad de Comunicaciones</h1>
                </div>

                {/* Filtros de fecha */}
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label>Desde</Label>
                                <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>Hasta</Label>
                                <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40" />
                            </div>
                            <Button onClick={apply}>Aplicar</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            Actividad del período
                            <Badge variant="secondary" className="ml-1">{contacts.length} contactos</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {contacts.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                                <MessageSquare className="h-8 w-8 opacity-30" />
                                <p className="text-sm">Sin comunicaciones en el período seleccionado.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 pr-4 font-medium">Contacto</th>
                                            <th className="pb-2 pr-4 font-medium text-center">Total</th>
                                            <th className="pb-2 pr-4 font-medium">Desglose</th>
                                            <th className="pb-2 font-medium">Última comunicación</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contacts.map(c => (
                                            <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                                <td className="py-2 pr-4">
                                                    <Link href={`/contacts/${c.id}/edit`} className="font-medium hover:text-primary hover:underline">{c.name}</Link>
                                                </td>
                                                <td className="py-2 pr-4 text-center">
                                                    <Badge variant="secondary">{c.communication_count}</Badge>
                                                </td>
                                                <td className="py-2 pr-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {Object.entries(c.communication_types).map(([type, count]) => (
                                                            <span key={type} className="text-xs text-muted-foreground">
                                                                {TYPES[type] ?? type}: <strong>{count}</strong>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-2 text-xs text-muted-foreground">{c.last_communication ?? '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CommunicationActivityReport.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contactos', href: '/contacts' },
        { title: 'Actividad de Comunicaciones', href: '#' },
    ],
};
