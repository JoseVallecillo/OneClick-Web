import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { useState } from 'react';

interface JournalOption { id: number; name: string; code: string }
interface ExistingConfig {
    id: number; cai: string; range_from: string; range_to: string;
    expires_at: string; journal_id: number; establishment_code: string | null;
    terminal_code: string | null; active: boolean;
}
interface Props { config?: ExistingConfig; journals: JournalOption[] }

export default function CaiConfigForm({ config, journals }: Props) {
    const { props } = usePage<{ errors?: Record<string, string> }>();
    const errors = props.errors ?? {};
    const isEdit = Boolean(config);

    const [cai, setCai]                       = useState(config?.cai ?? '');
    const [rangeFrom, setRangeFrom]           = useState(config?.range_from ?? '');
    const [rangeTo, setRangeTo]               = useState(config?.range_to ?? '');
    const [expiresAt, setExpiresAt]           = useState(config?.expires_at ?? '');
    const [journalId, setJournalId]           = useState(config?.journal_id ? String(config.journal_id) : '');
    const [establishmentCode, setEstablishment] = useState(config?.establishment_code ?? '');
    const [terminalCode, setTerminal]         = useState(config?.terminal_code ?? '');
    const [active, setActive]                 = useState(config?.active ?? true);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            cai, range_from: rangeFrom, range_to: rangeTo, expires_at: expiresAt,
            journal_id: Number(journalId),
            establishment_code: establishmentCode || null,
            terminal_code: terminalCode || null,
            active,
        };
        if (isEdit && config) {
            router.patch(`/accounting/cai/${config.id}`, payload);
        } else {
            router.post('/accounting/cai', payload);
        }
    }

    return (
        <>
            <Head title={isEdit ? 'Editar CAI' : 'Registrar CAI'} />
            <form onSubmit={handleSubmit} className="flex h-full flex-1 flex-col gap-6 p-4 max-w-2xl">
                <div className="flex items-center gap-3">
                    <Link href="/accounting/cai">
                        <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                            <ArrowLeft className="h-4 w-4" /> Volver
                        </Button>
                    </Link>
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <KeyRound className="h-4 w-4" />
                        {isEdit ? 'Editar CAI' : 'Registrar Nuevo CAI'}
                    </h1>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Datos del CAI (SAR Honduras)</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5 col-span-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Clave CAI *</Label>
                            <Input value={cai} onChange={(e) => setCai(e.target.value.toUpperCase())}
                                placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XX" className="h-9 font-mono" />
                            {errors.cai && <p className="text-xs text-red-600">{errors.cai}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Rango Desde *</Label>
                            <Input value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)}
                                placeholder="00001" className="h-9 font-mono" />
                            {errors.range_from && <p className="text-xs text-red-600">{errors.range_from}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Rango Hasta *</Label>
                            <Input value={rangeTo} onChange={(e) => setRangeTo(e.target.value)}
                                placeholder="99999" className="h-9 font-mono" />
                            {errors.range_to && <p className="text-xs text-red-600">{errors.range_to}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Fecha de Vencimiento *</Label>
                            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="h-9" />
                            {errors.expires_at && <p className="text-xs text-red-600">{errors.expires_at}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Diario de Ventas *</Label>
                            <Select value={journalId} onValueChange={setJournalId}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar diario…" /></SelectTrigger>
                                <SelectContent>
                                    {journals.map((j) => (
                                        <SelectItem key={j.id} value={String(j.id)} className="text-xs">
                                            <span className="font-mono mr-2 text-muted-foreground">{j.code}</span>{j.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.journal_id && <p className="text-xs text-red-600">{errors.journal_id}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Código de Establecimiento</Label>
                            <Input value={establishmentCode} onChange={(e) => setEstablishment(e.target.value)}
                                placeholder="001" className="h-9 font-mono" />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold uppercase tracking-wider">Código de Punto de Emisión</Label>
                            <Input value={terminalCode} onChange={(e) => setTerminal(e.target.value)}
                                placeholder="001" className="h-9 font-mono" />
                        </div>

                        <div className="flex items-center gap-3 col-span-2">
                            <Switch id="active" checked={active} onCheckedChange={setActive} />
                            <Label htmlFor="active" className="text-sm">CAI activo</Label>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Link href="/accounting/cai">
                        <Button type="button" variant="outline" size="sm">Cancelar</Button>
                    </Link>
                    <Button type="submit" size="sm" className="bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-black">
                        {isEdit ? 'Guardar cambios' : 'Registrar CAI'}
                    </Button>
                </div>
            </form>
        </>
    );
}

CaiConfigForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'CAI', href: '/accounting/cai' },
        { title: 'CAI', href: '#' },
    ],
};
