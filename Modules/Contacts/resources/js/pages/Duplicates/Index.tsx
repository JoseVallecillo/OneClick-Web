import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Copy, GitMerge, X } from 'lucide-react';
import { useState } from 'react';

interface DuplicateRow {
    id: number;
    contact_1_name: string; contact_1_rtn: string|null;
    contact_2_name: string; contact_2_rtn: string|null;
    similarity_score: number; match_fields: string[];
    status: string; merged_into_name: string|null;
}
interface Paginated { data: DuplicateRow[]; links: { url: string|null; label: string; active: boolean }[]; total?: number; }
interface Props {
    duplicates: Paginated;
    currentStatus: string;
    statuses: Record<string, string>;
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    merged: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    dismissed: 'bg-muted text-muted-foreground',
};

function MergeDialog({ duplicate, onClose }: { duplicate: DuplicateRow; onClose: () => void }) {
    const [keepId, setKeepId] = useState<number|null>(null);
    const [processing, setProcessing] = useState(false);

    // Extract IDs from names — we'll use a different approach by passing them
    // The merge action just needs keep_id and merge_id
    const options = [
        { label: duplicate.contact_1_name, rtn: duplicate.contact_1_rtn },
        { label: duplicate.contact_2_name, rtn: duplicate.contact_2_rtn },
    ];

    function merge() {
        if (keepId === null) return;
        setProcessing(true);
        router.post(`/contacts/duplicates/${duplicate.id}/merge`,
            { keep_id: keepId, merge_id: keepId === 0 ? 1 : 0 },
            { onFinish: () => { setProcessing(false); onClose(); } }
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-xl shadow-xl border p-6 w-full max-w-lg mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-lg">Fusionar contactos</h2>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Selecciona cuál contacto quieres conservar. El otro será eliminado y sus datos transferidos al seleccionado.</p>
                <div className="flex flex-col gap-3 mb-6">
                    {options.map((opt, i) => (
                        <button key={i} onClick={() => setKeepId(i)}
                            className={`rounded-lg border p-3 text-left transition-colors ${keepId === i ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                            <p className="text-sm font-medium">{opt.label}</p>
                            {opt.rtn && <p className="text-xs text-muted-foreground font-mono">RTN: {opt.rtn}</p>}
                            {keepId === i && <p className="text-xs text-primary mt-1 font-medium">Este se conservará</p>}
                        </button>
                    ))}
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button disabled={keepId === null || processing} onClick={merge}>
                        {processing ? <><Spinner className="mr-1 h-3 w-3" />Fusionando…</> : <><GitMerge className="mr-1.5 h-4 w-4" />Fusionar</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function DuplicatesIndex({ duplicates, currentStatus, statuses }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;
    const [scanning, setScanning] = useState(false);
    const [merging, setMerging]   = useState<DuplicateRow|null>(null);

    function scan() {
        setScanning(true);
        router.post('/contacts/duplicates/scan', {}, { onFinish: () => setScanning(false) });
    }

    function dismiss(id: number) {
        if (!confirm('¿Descartar este posible duplicado?')) return;
        router.post(`/contacts/duplicates/${id}/dismiss`);
    }

    return (
        <>
            <Head title="Duplicados — Contactos" />
            {merging && <MergeDialog duplicate={merging} onClose={() => setMerging(null)} />}

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/contacts"><Button variant="ghost" size="sm" className="pl-1">← Contactos</Button></Link>
                        <span className="text-muted-foreground">/</span>
                        <h1 className="text-lg font-semibold flex items-center gap-2"><Copy className="h-5 w-5" />Detección de Duplicados</h1>
                    </div>
                    <Button variant="outline" onClick={scan} disabled={scanning}>
                        {scanning ? <><Spinner className="mr-1 h-3 w-3" />Analizando…</> : 'Escanear duplicados'}
                    </Button>
                </div>

                {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{flash.success}</div>}
                {flash?.error   && <div className="rounded-lg border border-red-200   bg-red-50   px-4 py-3 text-sm text-red-800">{flash.error}</div>}

                {/* Filtros de estado */}
                <div className="flex gap-2 flex-wrap">
                    {Object.entries(statuses).map(([key, label]) => (
                        <Link key={key} href={`/contacts/duplicates?status=${key}`}>
                            <Button variant={currentStatus === key ? 'default' : 'outline'} size="sm">{label}</Button>
                        </Link>
                    ))}
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            Posibles duplicados
                            {duplicates.total !== undefined && <Badge variant="secondary" className="ml-1">{duplicates.total}</Badge>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {duplicates.data.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                                <Copy className="h-8 w-8 opacity-30" />
                                <p className="text-sm">No hay duplicados {statuses[currentStatus]?.toLowerCase()}.</p>
                                {currentStatus === 'pending' && (
                                    <Button variant="outline" size="sm" onClick={scan} disabled={scanning}>
                                        {scanning ? 'Analizando…' : 'Escanear ahora'}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {duplicates.data.map(dup => (
                                    <div key={dup.id} className="rounded-lg border p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex flex-col gap-2 flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[dup.status] ?? ''}`}>
                                                        {statuses[dup.status] ?? dup.status}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">Similitud: <strong>{dup.similarity_score.toFixed(0)}%</strong></span>
                                                    {dup.match_fields?.length > 0 && (
                                                        <span className="text-xs text-muted-foreground">Campos: {dup.match_fields.join(', ')}</span>
                                                    )}
                                                </div>

                                                <div className="grid sm:grid-cols-2 gap-3">
                                                    <div className="rounded-md bg-muted/30 p-2.5">
                                                        <p className="text-sm font-medium">{dup.contact_1_name}</p>
                                                        {dup.contact_1_rtn && <p className="text-xs text-muted-foreground font-mono">RTN: {dup.contact_1_rtn}</p>}
                                                    </div>
                                                    <div className="rounded-md bg-muted/30 p-2.5">
                                                        <p className="text-sm font-medium">{dup.contact_2_name}</p>
                                                        {dup.contact_2_rtn && <p className="text-xs text-muted-foreground font-mono">RTN: {dup.contact_2_rtn}</p>}
                                                    </div>
                                                </div>

                                                {dup.merged_into_name && (
                                                    <p className="text-xs text-muted-foreground">Fusionado en: <strong>{dup.merged_into_name}</strong></p>
                                                )}
                                            </div>

                                            {dup.status === 'pending' && (
                                                <div className="flex shrink-0 gap-2">
                                                    <Button size="sm" variant="outline" className="flex items-center gap-1.5" onClick={() => setMerging(dup)}>
                                                        <GitMerge className="h-3.5 w-3.5" />Fusionar
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="flex items-center gap-1.5 text-muted-foreground" onClick={() => dismiss(dup.id)}>
                                                        <X className="h-3.5 w-3.5" />Descartar
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {duplicates.links.length > 3 && (
                                    <div className="flex justify-center gap-1 pt-2">
                                        {duplicates.links.map((link, i) => (
                                            <Button key={i} variant={link.active ? 'default' : 'outline'} size="sm"
                                                className="h-7 min-w-[28px] px-2 text-xs" disabled={!link.url || link.active}
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

DuplicatesIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contactos', href: '/contacts' },
        { title: 'Duplicados', href: '#' },
    ],
};
