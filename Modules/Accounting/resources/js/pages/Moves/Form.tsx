import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dashboard } from '@/routes';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AccountOption  { id: number; code: string; name: string; type: string; normal_balance: string }
interface JournalOption  { id: number; name: string; code: string; type: string }
interface PartnerOption  { id: number; name: string }

interface LineItem {
    key: number;
    account_id: string;
    partner_id: string;
    name: string;
    debit: string;
    credit: string;
}

interface ExistingMove {
    id: number;
    reference: string;
    journal_id: number;
    date: string;
    narration: string | null;
    lines: {
        id: number;
        account_id: number;
        partner_id: number | null;
        name: string | null;
        debit: string;
        credit: string;
    }[];
}

interface Props {
    move?: ExistingMove;
    journals: JournalOption[];
    accounts: AccountOption[];
    partners: PartnerOption[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

let keyCounter = 100;
function nextKey() { return ++keyCounter; }

function emptyLine(): LineItem {
    return { key: nextKey(), account_id: '', partner_id: 'none', name: '', debit: '', credit: '' };
}

function fmtNum(v: string | number) {
    const n = Number(v);
    return isNaN(n) ? '0.00' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MoveForm({ move, journals, accounts, partners }: Props) {
    const { props } = usePage<{ errors?: Record<string, string> }>();
    const errors = props.errors ?? {};
    const isEdit = Boolean(move);

    const [journalId, setJournalId] = useState(move?.journal_id ? String(move.journal_id) : '');
    const [date, setDate]           = useState(move?.date ?? new Date().toISOString().slice(0, 10));
    const [narration, setNarration] = useState(move?.narration ?? '');
    const [lines, setLines]         = useState<LineItem[]>(
        move?.lines?.length
            ? move.lines.map((l) => ({
                key:        nextKey(),
                account_id: String(l.account_id),
                partner_id: l.partner_id ? String(l.partner_id) : 'none',
                name:       l.name ?? '',
                debit:      Number(l.debit) > 0 ? String(l.debit) : '',
                credit:     Number(l.credit) > 0 ? String(l.credit) : '',
            }))
            : [emptyLine(), emptyLine()]
    );

    const totalDebit  = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.0001;

    function updateLine(key: number, field: keyof Omit<LineItem, 'key'>, value: string) {
        setLines((prev) => prev.map((l) => l.key === key ? { ...l, [field]: value } : l));
    }

    function addLine() {
        setLines((prev) => [...prev, emptyLine()]);
    }

    function removeLine(key: number) {
        if (lines.length <= 2) return;
        setLines((prev) => prev.filter((l) => l.key !== key));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            journal_id: Number(journalId),
            date,
            narration: narration || null,
            lines: lines.map((l) => ({
                account_id: Number(l.account_id),
                partner_id: l.partner_id && l.partner_id !== "none" ? Number(l.partner_id) : null,
                name:       l.name || null,
                debit:      Number(l.debit) || 0,
                credit:     Number(l.credit) || 0,
            })),
        };

        if (isEdit && move) {
            router.patch(`/accounting/moves/${move.id}`, payload);
        } else {
            router.post('/accounting/moves', payload);
        }
    }

    return (
        <>
            <Head title={isEdit ? `Editar ${move!.reference}` : 'Nuevo Asiento'} />

            <form onSubmit={handleSubmit} className="flex h-full flex-1 flex-col gap-6 p-4 max-w-5xl">
                <div className="flex items-center gap-3">
                    <Link href={isEdit ? `/accounting/moves/${move!.id}` : '/accounting/moves'}>
                        <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                            <ArrowLeft className="h-4 w-4" /> Volver
                        </Button>
                    </Link>
                    <h1 className="text-lg font-semibold">
                        {isEdit ? `Editar ${move!.reference}` : 'Nuevo Asiento Contable'}
                    </h1>
                </div>

                {/* Header data */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Encabezado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="journal_id" className="text-xs font-semibold uppercase tracking-wider">Diario *</Label>
                                <Select value={journalId} onValueChange={setJournalId}>
                                    <SelectTrigger id="journal_id" className="h-9">
                                        <SelectValue placeholder="Seleccionar diario…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {journals.map((j) => (
                                            <SelectItem key={j.id} value={String(j.id)}>
                                                <span className="font-mono text-xs mr-2 text-muted-foreground">{j.code}</span>
                                                {j.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.journal_id && <p className="text-xs text-red-600">{errors.journal_id}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="date" className="text-xs font-semibold uppercase tracking-wider">Fecha *</Label>
                                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
                                {errors.date && <p className="text-xs text-red-600">{errors.date}</p>}
                            </div>

                            <div className="space-y-1.5 md:col-span-1">
                                <Label htmlFor="narration" className="text-xs font-semibold uppercase tracking-wider">Narración</Label>
                                <Input id="narration" value={narration} onChange={(e) => setNarration(e.target.value)}
                                    placeholder="Descripción del asiento…" className="h-9" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Lines */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Apuntes Contables</CardTitle>
                            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={addLine}>
                                <Plus className="h-3.5 w-3.5" /> Agregar línea
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                                        <th className="pb-2 pr-2 font-semibold w-[280px]">Cuenta *</th>
                                        <th className="pb-2 pr-2 font-semibold w-[180px]">Socio</th>
                                        <th className="pb-2 pr-2 font-semibold">Descripción</th>
                                        <th className="pb-2 pr-2 font-semibold text-right w-28">Debe</th>
                                        <th className="pb-2 pr-2 font-semibold text-right w-28">Haber</th>
                                        <th className="pb-2 w-8" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {lines.map((line, idx) => (
                                        <tr key={line.key} className="border-b last:border-0">
                                            <td className="py-1.5 pr-2">
                                                <Select value={line.account_id} onValueChange={(v) => updateLine(line.key, 'account_id', v)}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Cuenta…" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {accounts.map((a) => (
                                                            <SelectItem key={a.id} value={String(a.id)} className="text-xs">
                                                                <span className="font-mono mr-2 text-muted-foreground">{a.code}</span>
                                                                {a.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {errors[`lines.${idx}.account_id`] && (
                                                    <p className="text-[10px] text-red-600 mt-0.5">{errors[`lines.${idx}.account_id`]}</p>
                                                )}
                                            </td>
                                            <td className="py-1.5 pr-2">
                                                <Select value={line.partner_id} onValueChange={(v) => updateLine(line.key, 'partner_id', v)}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="— ninguno —" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">— ninguno —</SelectItem>
                                                        {partners.map((p) => (
                                                            <SelectItem key={p.id} value={String(p.id)} className="text-xs">{p.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="py-1.5 pr-2">
                                                <Input value={line.name} onChange={(e) => updateLine(line.key, 'name', e.target.value)}
                                                    placeholder="Descripción…" className="h-8 text-xs" />
                                            </td>
                                            <td className="py-1.5 pr-2">
                                                <Input
                                                    type="number" min="0" step="0.01"
                                                    value={line.debit}
                                                    onChange={(e) => {
                                                        updateLine(line.key, 'debit', e.target.value);
                                                        if (e.target.value) updateLine(line.key, 'credit', '');
                                                    }}
                                                    className="h-8 text-xs text-right tabular-nums"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="py-1.5 pr-2">
                                                <Input
                                                    type="number" min="0" step="0.01"
                                                    value={line.credit}
                                                    onChange={(e) => {
                                                        updateLine(line.key, 'credit', e.target.value);
                                                        if (e.target.value) updateLine(line.key, 'debit', '');
                                                    }}
                                                    className="h-8 text-xs text-right tabular-nums"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="py-1.5">
                                                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                                                    disabled={lines.length <= 2} onClick={() => removeLine(line.key)}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 font-semibold text-sm">
                                        <td colSpan={3} className="pt-2 text-xs uppercase tracking-wider text-muted-foreground">Totales</td>
                                        <td className={`pt-2 text-right font-mono tabular-nums ${!isBalanced ? 'text-red-600' : 'text-green-700'}`}>
                                            {fmtNum(totalDebit)}
                                        </td>
                                        <td className={`pt-2 text-right font-mono tabular-nums ${!isBalanced ? 'text-red-600' : 'text-green-700'}`}>
                                            {fmtNum(totalCredit)}
                                        </td>
                                        <td />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
                            <div className="mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                Diferencia: {fmtNum(Math.abs(totalDebit - totalCredit))} — el asiento debe estar balanceado para publicarse.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Link href={isEdit ? `/accounting/moves/${move!.id}` : '/accounting/moves'}>
                        <Button type="button" variant="outline" size="sm">Cancelar</Button>
                    </Link>
                    <Button type="submit" size="sm" className="bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-black">
                        {isEdit ? 'Guardar cambios' : 'Crear asiento'}
                    </Button>
                </div>
            </form>
        </>
    );
}

MoveForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contabilidad', href: '/accounting/moves' },
        { title: 'Libro Diario', href: '/accounting/moves' },
        { title: 'Asiento', href: '#' },
    ],
};
