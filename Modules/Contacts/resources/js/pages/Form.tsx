import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboard } from '@/routes';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    BookOpen,
    FileText,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    Plus,
    Star,
    Tag,
    Trash2,
    Users,
} from 'lucide-react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PersonRow { id: number; name: string; role: string|null; email: string|null; phone: string|null; mobile: string|null; notes: string|null; }
interface AddressRow { id: number; type: 'billing'|'delivery'|'other'; label: string|null; address_line: string; city: string|null; state: string|null; country: string; postal_code: string|null; is_default: boolean; }
interface BankDetail { id: number; bank_name: string; account_type: 'checking'|'savings'|'credit_line'; account_number: string; account_holder: string|null; swift_code: string|null; iban: string|null; is_default: boolean; active: boolean; }
interface PaymentTerm { id: number; term_name: string; days_to_pay: number; is_default: boolean; early_payment_discount: number|null; discount_days: number|null; late_payment_interest: number|null; notes: string|null; }
interface TagRow { id: number; name: string; color: string; }
interface CommunicationRow { id: number; type: string; subject: string|null; content: string; communication_date: string; outcome: string|null; follow_up_date: string|null; user?: { name: string }; }
interface DocumentRow { id: number; document_name: string; document_type: string; file_type: string; file_size: number; document_date: string|null; expiry_date: string|null; notes: string|null; }
interface SupplierEval { quality_rating: number; delivery_rating: number; communication_rating: number; price_rating: number; on_time_delivery_percent: number; defect_rate: number; average_delivery_days: number|null; notes: string|null; overall_rating: number; last_evaluation_date: string|null; }

interface ContactDetail {
    id: number; name: string; legal_name: string|null; rtn: string|null; dni: string|null;
    email: string|null; phone: string|null; mobile: string|null; website: string|null;
    is_client: boolean; is_supplier: boolean; is_employee: boolean; notes: string|null; active: boolean;
    addresses: AddressRow[]; persons: PersonRow[];
    bankDetails: BankDetail[]; paymentTerms: PaymentTerm[];
    tags: TagRow[]; communications: CommunicationRow[]; documents: DocumentRow[];
    supplierEvaluation: SupplierEval|null;
}

interface Props { contact: ContactDetail|null; allTags?: TagRow[]; }

// ── Helpers ────────────────────────────────────────────────────────────────────

const ADDR_LABELS: Record<string, string> = { billing: 'Facturación', delivery: 'Entrega', other: 'Otra' };
const COMM_TYPES: Record<string, string>  = { call: 'Llamada', email: 'Email', meeting: 'Reunión', note: 'Nota' };
const COMM_OUTCOMES: Record<string, string> = { positive: 'Positivo', negative: 'Negativo', neutral: 'Neutral', follow_up_needed: 'Seguimiento' };
const ACCT_TYPES: Record<string, string>  = { checking: 'Corriente', savings: 'Ahorro', credit_line: 'Línea de crédito' };
const DOC_TYPES: Record<string, string>   = { contract: 'Contrato', invoice: 'Factura', quote: 'Cotización', agreement: 'Acuerdo' };

function fmtBytes(n: number) { if (n < 1024) return `${n} B`; if (n < 1048576) return `${(n/1024).toFixed(1)} KB`; return `${(n/1048576).toFixed(1)} MB`; }

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
    return (
        <div className="flex gap-1">
            {[1,2,3,4,5].map(i => (
                <button key={i} type="button" onClick={() => onChange?.(i)}
                    className={`h-6 w-6 ${i <= value ? 'text-amber-400' : 'text-muted-foreground/30'} ${onChange ? 'hover:text-amber-300 cursor-pointer' : 'cursor-default'}`}>
                    <Star className="h-5 w-5 fill-current" />
                </button>
            ))}
        </div>
    );
}

// ── Address Form ───────────────────────────────────────────────────────────────

function AddressForm({ contactId, editing, onCancel }: { contactId: number; editing: AddressRow|null; onCancel: () => void }) {
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        type: (editing?.type ?? 'billing') as AddressRow['type'],
        label: editing?.label ?? '', address_line: editing?.address_line ?? '',
        city: editing?.city ?? '', state: editing?.state ?? '',
        country: editing?.country ?? 'Honduras', postal_code: editing?.postal_code ?? '',
        is_default: editing?.is_default ?? false,
    });
    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) patch(`/contacts/${contactId}/addresses/${editing.id}`, { onSuccess: () => onCancel() });
        else post(`/contacts/${contactId}/addresses`, { onSuccess: () => { reset(); onCancel(); } });
    }
    return (
        <form onSubmit={submit} className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                    <Label>Tipo</Label>
                    <Select value={data.type} onValueChange={(v) => setData('type', v as AddressRow['type'])}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="billing">Facturación</SelectItem>
                            <SelectItem value="delivery">Entrega</SelectItem>
                            <SelectItem value="other">Otra</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5"><Label>Etiqueta <span className="text-muted-foreground">(opcional)</span></Label><Input placeholder="Oficina central…" value={data.label} onChange={e => setData('label', e.target.value)} /></div>
                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1"><Label>Dirección *</Label><Input placeholder="Calle, número…" value={data.address_line} onChange={e => setData('address_line', e.target.value)} />{errors.address_line && <p className="text-xs text-destructive">{errors.address_line}</p>}</div>
                <div className="flex flex-col gap-1.5"><Label>Ciudad</Label><Input placeholder="Tegucigalpa" value={data.city} onChange={e => setData('city', e.target.value)} /></div>
                <div className="flex flex-col gap-1.5"><Label>Departamento</Label><Input placeholder="Francisco Morazán" value={data.state} onChange={e => setData('state', e.target.value)} /></div>
                <div className="flex flex-col gap-1.5"><Label>País</Label><Input value={data.country} onChange={e => setData('country', e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-2">
                <Checkbox id="addr_default" checked={data.is_default} onCheckedChange={v => setData('is_default', v === true)} />
                <Label htmlFor="addr_default" className="cursor-pointer">Usar como predeterminada</Label>
            </div>
            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={processing}>{processing ? <><Spinner className="mr-1 h-3 w-3" />Guardando…</> : editing ? 'Actualizar' : 'Agregar'}</Button>
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
            </div>
        </form>
    );
}

// ── Person Form ────────────────────────────────────────────────────────────────

function PersonForm({ contactId, editing, onCancel }: { contactId: number; editing: PersonRow|null; onCancel: () => void }) {
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        name: editing?.name ?? '', role: editing?.role ?? '', email: editing?.email ?? '',
        phone: editing?.phone ?? '', mobile: editing?.mobile ?? '', notes: editing?.notes ?? '',
    });
    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) patch(`/contacts/${contactId}/persons/${editing.id}`, { onSuccess: () => onCancel() });
        else post(`/contacts/${contactId}/persons`, { onSuccess: () => { reset(); onCancel(); } });
    }
    return (
        <form onSubmit={submit} className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1.5"><Label>Nombre *</Label><Input placeholder="María García" value={data.name} onChange={e => setData('name', e.target.value)} />{errors.name && <p className="text-xs text-destructive">{errors.name}</p>}</div>
                <div className="flex flex-col gap-1.5"><Label>Cargo</Label><Input placeholder="Gerente de Ventas" value={data.role} onChange={e => setData('role', e.target.value)} /></div>
                <div className="flex flex-col gap-1.5"><Label>Correo</Label><Input type="email" placeholder="maria@empresa.com" value={data.email} onChange={e => setData('email', e.target.value)} />{errors.email && <p className="text-xs text-destructive">{errors.email}</p>}</div>
                <div className="flex flex-col gap-1.5"><Label>Teléfono</Label><Input placeholder="2222-3333" value={data.phone} onChange={e => setData('phone', e.target.value)} /></div>
                <div className="flex flex-col gap-1.5"><Label>Móvil</Label><Input placeholder="9999-8888" value={data.mobile} onChange={e => setData('mobile', e.target.value)} /></div>
                <div className="flex flex-col gap-1.5"><Label>Notas</Label><Input placeholder="Disponible lunes a viernes…" value={data.notes} onChange={e => setData('notes', e.target.value)} /></div>
            </div>
            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={processing}>{processing ? <><Spinner className="mr-1 h-3 w-3" />Guardando…</> : editing ? 'Actualizar' : 'Agregar persona'}</Button>
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
            </div>
        </form>
    );
}

// ── Bank Detail Form ───────────────────────────────────────────────────────────

function BankForm({ contactId, editing, onCancel }: { contactId: number; editing: BankDetail|null; onCancel: () => void }) {
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        bank_name: editing?.bank_name ?? '', account_type: (editing?.account_type ?? 'checking') as BankDetail['account_type'],
        account_number: editing?.account_number ?? '', account_holder: editing?.account_holder ?? '',
        swift_code: editing?.swift_code ?? '', iban: editing?.iban ?? '',
        is_default: editing?.is_default ?? false, active: editing?.active ?? true,
    });
    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) patch(`/contacts/${contactId}/bank-details/${editing.id}`, { onSuccess: () => onCancel() });
        else post(`/contacts/${contactId}/bank-details`, { onSuccess: () => { reset(); onCancel(); } });
    }
    return (
        <form onSubmit={submit} className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1.5"><Label>Banco *</Label><Input placeholder="Banco Atlántida" value={data.bank_name} onChange={e => setData('bank_name', e.target.value)} />{errors.bank_name && <p className="text-xs text-destructive">{errors.bank_name}</p>}</div>
                <div className="flex flex-col gap-1.5">
                    <Label>Tipo de cuenta</Label>
                    <Select value={data.account_type} onValueChange={v => setData('account_type', v as BankDetail['account_type'])}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="checking">Corriente</SelectItem>
                            <SelectItem value="savings">Ahorro</SelectItem>
                            <SelectItem value="credit_line">Línea de crédito</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5"><Label>Número de cuenta *</Label><Input placeholder="1234567890" className="font-mono" value={data.account_number} onChange={e => setData('account_number', e.target.value)} />{errors.account_number && <p className="text-xs text-destructive">{errors.account_number}</p>}</div>
                <div className="flex flex-col gap-1.5"><Label>Titular</Label><Input placeholder="Distribuidora López S.A." value={data.account_holder} onChange={e => setData('account_holder', e.target.value)} /></div>
                <div className="flex flex-col gap-1.5"><Label>SWIFT</Label><Input placeholder="ATHNHNTG" className="font-mono uppercase" value={data.swift_code} onChange={e => setData('swift_code', e.target.value.toUpperCase())} /></div>
                <div className="flex flex-col gap-1.5"><Label>IBAN</Label><Input placeholder="HN12XXXX…" className="font-mono" value={data.iban} onChange={e => setData('iban', e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><Checkbox id="bank_default" checked={data.is_default} onCheckedChange={v => setData('is_default', v === true)} /><Label htmlFor="bank_default" className="cursor-pointer">Cuenta predeterminada</Label></div>
                <div className="flex items-center gap-2"><Checkbox id="bank_active" checked={data.active} onCheckedChange={v => setData('active', v === true)} /><Label htmlFor="bank_active" className="cursor-pointer">Activa</Label></div>
            </div>
            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={processing}>{processing ? <><Spinner className="mr-1 h-3 w-3" />Guardando…</> : editing ? 'Actualizar' : 'Agregar cuenta'}</Button>
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
            </div>
        </form>
    );
}

// ── Payment Term Form ──────────────────────────────────────────────────────────

function PaymentTermForm({ contactId, editing, onCancel }: { contactId: number; editing: PaymentTerm|null; onCancel: () => void }) {
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        term_name: editing?.term_name ?? '', days_to_pay: editing?.days_to_pay ?? 30,
        is_default: editing?.is_default ?? false,
        early_payment_discount: editing?.early_payment_discount ?? '',
        discount_days: editing?.discount_days ?? '',
        late_payment_interest: editing?.late_payment_interest ?? '',
        notes: editing?.notes ?? '',
    });
    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) patch(`/contacts/${contactId}/payment-terms/${editing.id}`, { onSuccess: () => onCancel() });
        else post(`/contacts/${contactId}/payment-terms`, { onSuccess: () => { reset(); onCancel(); } });
    }
    return (
        <form onSubmit={submit} className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>Nombre *</Label><Input placeholder="Crédito 30 días" value={data.term_name} onChange={e => setData('term_name', e.target.value)} />{errors.term_name && <p className="text-xs text-destructive">{errors.term_name}</p>}</div>
                <div className="flex flex-col gap-1.5"><Label>Días para pagar</Label><Input type="number" min="0" value={data.days_to_pay} onChange={e => setData('days_to_pay', parseInt(e.target.value) || 0)} /></div>
                <div className="flex flex-col gap-1.5"><Label>Descuento pronto pago (%)</Label><Input type="number" min="0" max="100" step="0.01" placeholder="2.5" value={data.early_payment_discount} onChange={e => setData('early_payment_discount', e.target.value)} /></div>
                <div className="flex flex-col gap-1.5"><Label>Días descuento</Label><Input type="number" min="0" placeholder="10" value={data.discount_days} onChange={e => setData('discount_days', e.target.value)} /></div>
                <div className="flex flex-col gap-1.5"><Label>Interés mora (%)</Label><Input type="number" min="0" max="100" step="0.01" placeholder="1.5" value={data.late_payment_interest} onChange={e => setData('late_payment_interest', e.target.value)} /></div>
                <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>Notas</Label><Input placeholder="Condiciones especiales…" value={data.notes} onChange={e => setData('notes', e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-2"><Checkbox id="term_default" checked={data.is_default} onCheckedChange={v => setData('is_default', v === true)} /><Label htmlFor="term_default" className="cursor-pointer">Término predeterminado</Label></div>
            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={processing}>{processing ? <><Spinner className="mr-1 h-3 w-3" />Guardando…</> : editing ? 'Actualizar' : 'Agregar término'}</Button>
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
            </div>
        </form>
    );
}

// ── Communication Form (inline quick-add) ──────────────────────────────────────

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
        <form onSubmit={submit} className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-1.5">
                    <Label>Tipo *</Label>
                    <Select value={data.type} onValueChange={v => setData('type', v)}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(COMM_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5"><Label>Fecha *</Label><Input type="date" value={data.communication_date} onChange={e => setData('communication_date', e.target.value)} /></div>
                <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>Asunto</Label><Input placeholder="Reunión de seguimiento…" value={data.subject} onChange={e => setData('subject', e.target.value)} /></div>
                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-4">
                    <Label>Contenido *</Label>
                    <textarea className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px]"
                        placeholder="Detalle de la comunicación…" value={data.content} onChange={e => setData('content', e.target.value)} rows={3} />
                    {errors.content && <p className="text-xs text-destructive">{errors.content}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Resultado</Label>
                    <Select value={data.outcome} onValueChange={v => setData('outcome', v)}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Sin resultado</SelectItem>
                            {Object.entries(COMM_OUTCOMES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5"><Label>Seguimiento</Label><Input type="date" value={data.follow_up_date} onChange={e => setData('follow_up_date', e.target.value)} /></div>
            </div>
            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={processing}>{processing ? <><Spinner className="mr-1 h-3 w-3" />Guardando…</> : 'Registrar comunicación'}</Button>
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
            </div>
        </form>
    );
}

// ── Document Upload Form ───────────────────────────────────────────────────────

function DocUploadForm({ contactId, onCancel }: { contactId: number; onCancel: () => void }) {
    const [processing, setProcessing] = useState(false);
    const [docType, setDocType]   = useState('contract');
    const [docName, setDocName]   = useState('');
    const [docDate, setDocDate]   = useState('');
    const [file, setFile]         = useState<File|null>(null);
    const [notes, setNotes]       = useState('');

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (!file) return;
        setProcessing(true);
        const fd = new FormData();
        fd.append('document_type', docType);
        fd.append('document_name', docName || file.name);
        if (docDate) fd.append('document_date', docDate);
        fd.append('file', file);
        if (notes) fd.append('notes', notes);
        router.post(`/contacts/${contactId}/documents`, fd, {
            forceFormData: true,
            onFinish: () => { setProcessing(false); onCancel(); },
        });
    }

    return (
        <form onSubmit={submit} className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-1.5">
                    <Label>Tipo *</Label>
                    <Select value={docType} onValueChange={setDocType}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Object.entries(DOC_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>Nombre del documento</Label><Input placeholder="Contrato de servicio 2026" value={docName} onChange={e => setDocName(e.target.value)} /></div>
                <div className="flex flex-col gap-1.5"><Label>Fecha del documento</Label><Input type="date" value={docDate} onChange={e => setDocDate(e.target.value)} /></div>
                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-4">
                    <Label>Archivo *</Label>
                    <input type="file" className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90 cursor-pointer"
                        onChange={e => setFile(e.target.files?.[0] ?? null)} />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-4"><Label>Notas</Label><Input placeholder="Observaciones sobre el documento…" value={notes} onChange={e => setNotes(e.target.value)} /></div>
            </div>
            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={processing || !file}>{processing ? <><Spinner className="mr-1 h-3 w-3" />Subiendo…</> : 'Subir documento'}</Button>
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
            </div>
        </form>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ContactForm({ contact, allTags = [] }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash  = props.flash;
    const isEdit = contact !== null;

    const { data, setData, post, patch, processing, errors } = useForm({
        name:        contact?.name        ?? '',
        legal_name:  contact?.legal_name  ?? '',
        rtn:         contact?.rtn         ?? '',
        dni:         contact?.dni         ?? '',
        email:       contact?.email       ?? '',
        phone:       contact?.phone       ?? '',
        mobile:      contact?.mobile      ?? '',
        website:     contact?.website     ?? '',
        is_client:   contact?.is_client   ?? false,
        is_supplier: contact?.is_supplier ?? false,
        is_employee: contact?.is_employee ?? false,
        notes:       contact?.notes       ?? '',
        active:      contact?.active      ?? true,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEdit) patch(`/contacts/${contact.id}`);
        else post('/contacts');
    }

    // Local sub-section states
    const [showAddrForm, setShowAddrForm]     = useState(false);
    const [editingAddr, setEditingAddr]       = useState<AddressRow|null>(null);
    const [showPersonForm, setShowPersonForm] = useState(false);
    const [editingPerson, setEditingPerson]   = useState<PersonRow|null>(null);
    const [showBankForm, setShowBankForm]     = useState(false);
    const [editingBank, setEditingBank]       = useState<BankDetail|null>(null);
    const [showTermForm, setShowTermForm]     = useState(false);
    const [editingTerm, setEditingTerm]       = useState<PaymentTerm|null>(null);
    const [showCommForm, setShowCommForm]     = useState(false);
    const [showDocForm, setShowDocForm]       = useState(false);

    function del(url: string) { if (!confirm('¿Confirmas la eliminación?')) return; router.delete(url); }

    // Tags sync
    const contactTagIds = contact?.tags?.map(t => t.id) ?? [];
    function toggleTag(tagId: number, checked: boolean) {
        if (!contact) return;
        const current = contact.tags?.map(t => t.id) ?? [];
        const next = checked ? [...current, tagId] : current.filter(id => id !== tagId);
        router.post(`/contacts/${contact.id}/tags`, { tag_ids: next }, { preserveScroll: true });
    }

    return (
        <>
            <Head title={isEdit ? `Editar: ${contact.name}` : 'Nuevo Contacto'} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href="/contacts">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />Contactos
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">{isEdit ? contact.name : 'Nuevo Contacto'}</h1>
                </div>

                {/* Flash */}
                {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">{flash.success}</div>}
                {flash?.error   && <div className="rounded-lg border border-red-200   bg-red-50   px-4 py-3 text-sm text-red-800   dark:border-red-800   dark:bg-red-950   dark:text-red-300">{flash.error}</div>}

                {isEdit ? (
                    <Tabs defaultValue="general" className="flex flex-col gap-4">
                        <TabsList className="flex flex-wrap h-auto gap-1 w-full justify-start bg-muted/50 p-1">
                            <TabsTrigger value="general"        className="flex items-center gap-1.5 text-xs"><BookOpen className="h-3.5 w-3.5" />General</TabsTrigger>
                            <TabsTrigger value="addresses"      className="flex items-center gap-1.5 text-xs"><MapPin className="h-3.5 w-3.5" />Direcciones <Badge variant="secondary" className="ml-1 text-[10px]">{contact.addresses.length}</Badge></TabsTrigger>
                            <TabsTrigger value="persons"        className="flex items-center gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />Personas <Badge variant="secondary" className="ml-1 text-[10px]">{contact.persons.length}</Badge></TabsTrigger>
                            <TabsTrigger value="financial"      className="flex items-center gap-1.5 text-xs"><Banknote className="h-3.5 w-3.5" />Financiero</TabsTrigger>
                            <TabsTrigger value="communications" className="flex items-center gap-1.5 text-xs"><MessageSquare className="h-3.5 w-3.5" />Comunicaciones <Badge variant="secondary" className="ml-1 text-[10px]">{contact.communications.length}</Badge></TabsTrigger>
                            <TabsTrigger value="documents"      className="flex items-center gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" />Documentos <Badge variant="secondary" className="ml-1 text-[10px]">{contact.documents.length}</Badge></TabsTrigger>
                            <TabsTrigger value="tags"           className="flex items-center gap-1.5 text-xs"><Tag className="h-3.5 w-3.5" />Etiquetas <Badge variant="secondary" className="ml-1 text-[10px]">{contact.tags.length}</Badge></TabsTrigger>
                            {contact.is_supplier && <TabsTrigger value="supplier" className="flex items-center gap-1.5 text-xs"><Star className="h-3.5 w-3.5" />Proveedor</TabsTrigger>}
                        </TabsList>

                        {/* ── TAB: GENERAL ─────────────────────────────────────── */}
                        <TabsContent value="general">
                            <form onSubmit={submit} className="flex flex-col gap-6">
                                <Card>
                                    <CardHeader className="pb-3"><CardTitle className="text-base">Información general</CardTitle></CardHeader>
                                    <CardContent className="grid gap-4 sm:grid-cols-2">
                                        <div className="flex flex-col gap-1.5"><Label htmlFor="name">Nombre comercial *</Label><Input id="name" placeholder="Distribuidora López S.A." value={data.name} onChange={e => setData('name', e.target.value)} />{errors.name && <p className="text-xs text-destructive">{errors.name}</p>}</div>
                                        <div className="flex flex-col gap-1.5"><Label htmlFor="legal_name">Razón social</Label><Input id="legal_name" placeholder="Distribuidora López Honduras S. de R.L." value={data.legal_name} onChange={e => setData('legal_name', e.target.value)} /></div>
                                        <div className="flex flex-col gap-1.5"><Label htmlFor="rtn">RTN <span className="text-muted-foreground">(14 dígitos)</span></Label><Input id="rtn" placeholder="08011999123456" maxLength={20} className="font-mono" value={data.rtn} onChange={e => setData('rtn', e.target.value.replace(/\D/g, ''))} />{errors.rtn && <p className="text-xs text-destructive">{errors.rtn}</p>}</div>
                                        <div className="flex flex-col gap-1.5"><Label htmlFor="dni">DNI</Label><Input id="dni" placeholder="0801-1999-12345" maxLength={15} className="font-mono" value={data.dni} onChange={e => setData('dni', e.target.value)} /></div>
                                        <div className="flex flex-col gap-1.5"><Label htmlFor="email">Correo electrónico</Label><Input id="email" type="email" placeholder="contacto@empresa.com" value={data.email} onChange={e => setData('email', e.target.value)} />{errors.email && <p className="text-xs text-destructive">{errors.email}</p>}</div>
                                        <div className="flex flex-col gap-1.5"><Label htmlFor="phone">Teléfono fijo</Label><Input id="phone" placeholder="2222-3333" value={data.phone} onChange={e => setData('phone', e.target.value)} /></div>
                                        <div className="flex flex-col gap-1.5"><Label htmlFor="mobile">Teléfono móvil</Label><Input id="mobile" placeholder="9999-8888" value={data.mobile} onChange={e => setData('mobile', e.target.value)} /></div>
                                        <div className="flex flex-col gap-1.5"><Label htmlFor="website">Sitio web</Label><Input id="website" type="url" placeholder="https://empresa.com" value={data.website} onChange={e => setData('website', e.target.value)} />{errors.website && <p className="text-xs text-destructive">{errors.website}</p>}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-3"><CardTitle className="text-base">Categorización</CardTitle></CardHeader>
                                    <CardContent className="flex flex-wrap gap-6">
                                        <div className="flex items-center gap-2"><Checkbox id="is_client" checked={data.is_client} onCheckedChange={v => setData('is_client', v === true)} /><Label htmlFor="is_client" className="cursor-pointer">Cliente</Label></div>
                                        <div className="flex items-center gap-2"><Checkbox id="is_supplier" checked={data.is_supplier} onCheckedChange={v => setData('is_supplier', v === true)} /><Label htmlFor="is_supplier" className="cursor-pointer">Proveedor</Label></div>
                                        <div className="flex items-center gap-2"><Checkbox id="is_employee" checked={data.is_employee} onCheckedChange={v => setData('is_employee', v === true)} /><Label htmlFor="is_employee" className="cursor-pointer">Empleado</Label></div>
                                        <div className="flex items-center gap-2 border-l pl-6"><Checkbox id="active" checked={data.active} onCheckedChange={v => setData('active', v === true)} /><Label htmlFor="active" className="cursor-pointer">Activo</Label></div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-3"><CardTitle className="text-base">Notas internas</CardTitle></CardHeader>
                                    <CardContent>
                                        <textarea className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                                            placeholder="Observaciones, condiciones especiales…" value={data.notes} onChange={e => setData('notes', e.target.value)} rows={3} />
                                    </CardContent>
                                </Card>
                                <div className="flex justify-end gap-3">
                                    <Link href="/contacts"><Button type="button" variant="outline">Cancelar</Button></Link>
                                    <Button type="submit" disabled={processing}>{processing ? <><Spinner className="mr-1" />Guardando…</> : 'Actualizar contacto'}</Button>
                                </div>
                            </form>
                        </TabsContent>

                        {/* ── TAB: DIRECCIONES ────────────────────────────────── */}
                        <TabsContent value="addresses">
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-base"><MapPin className="h-4 w-4" />Direcciones</CardTitle>
                                        {!showAddrForm && !editingAddr && <Button variant="outline" size="sm" className="flex items-center gap-1.5" onClick={() => setShowAddrForm(true)}><Plus className="h-3.5 w-3.5" />Agregar</Button>}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    {showAddrForm && <AddressForm contactId={contact.id} editing={null} onCancel={() => setShowAddrForm(false)} />}
                                    {contact.addresses.length === 0 && !showAddrForm && <p className="text-sm text-muted-foreground">Sin direcciones registradas.</p>}
                                    {contact.addresses.map(addr => (
                                        <div key={addr.id}>
                                            {editingAddr?.id === addr.id
                                                ? <AddressForm contactId={contact.id} editing={addr} onCancel={() => setEditingAddr(null)} />
                                                : <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-[10px]">{ADDR_LABELS[addr.type]}</Badge>
                                                            {addr.is_default && <Badge variant="default" className="text-[10px]">Predeterminada</Badge>}
                                                            {addr.label && <span className="text-xs font-medium">{addr.label}</span>}
                                                        </div>
                                                        <p className="mt-1 text-sm">{addr.address_line}</p>
                                                        <p className="text-xs text-muted-foreground">{[addr.city, addr.state, addr.country].filter(Boolean).join(', ')}</p>
                                                    </div>
                                                    <div className="flex shrink-0 gap-1">
                                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setShowAddrForm(false); setEditingAddr(addr); }}>Editar</Button>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => del(`/contacts/${contact.id}/addresses/${addr.id}`)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── TAB: PERSONAS ───────────────────────────────────── */}
                        <TabsContent value="persons">
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" />Personas de contacto</CardTitle>
                                        {!showPersonForm && !editingPerson && <Button variant="outline" size="sm" className="flex items-center gap-1.5" onClick={() => setShowPersonForm(true)}><Plus className="h-3.5 w-3.5" />Agregar</Button>}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    {showPersonForm && <PersonForm contactId={contact.id} editing={null} onCancel={() => setShowPersonForm(false)} />}
                                    {contact.persons.length === 0 && !showPersonForm && <p className="text-sm text-muted-foreground">Sin personas registradas.</p>}
                                    {contact.persons.map(person => (
                                        <div key={person.id}>
                                            {editingPerson?.id === person.id
                                                ? <PersonForm contactId={contact.id} editing={person} onCancel={() => setEditingPerson(null)} />
                                                : <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium">{person.name}</span>
                                                            {person.role && <Badge variant="outline" className="text-[10px]">{person.role}</Badge>}
                                                        </div>
                                                        <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                                                            {person.email  && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{person.email}</span>}
                                                            {person.phone  && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{person.phone}</span>}
                                                            {person.mobile && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{person.mobile}</span>}
                                                        </div>
                                                        {person.notes && <p className="mt-1 text-xs text-muted-foreground">{person.notes}</p>}
                                                    </div>
                                                    <div className="flex shrink-0 gap-1">
                                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setShowPersonForm(false); setEditingPerson(person); }}>Editar</Button>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => del(`/contacts/${contact.id}/persons/${person.id}`)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── TAB: FINANCIERO ─────────────────────────────────── */}
                        <TabsContent value="financial" className="flex flex-col gap-6">
                            {/* Información Bancaria */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-base"><Banknote className="h-4 w-4" />Cuentas Bancarias <Badge variant="secondary" className="ml-1">{contact.bankDetails.length}</Badge></CardTitle>
                                        {!showBankForm && !editingBank && <Button variant="outline" size="sm" className="flex items-center gap-1.5" onClick={() => setShowBankForm(true)}><Plus className="h-3.5 w-3.5" />Agregar cuenta</Button>}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    {showBankForm && <BankForm contactId={contact.id} editing={null} onCancel={() => setShowBankForm(false)} />}
                                    {contact.bankDetails.length === 0 && !showBankForm && <p className="text-sm text-muted-foreground">Sin cuentas bancarias registradas.</p>}
                                    {contact.bankDetails.map(bank => (
                                        <div key={bank.id}>
                                            {editingBank?.id === bank.id
                                                ? <BankForm contactId={contact.id} editing={bank} onCancel={() => setEditingBank(null)} />
                                                : <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium">{bank.bank_name}</span>
                                                            <Badge variant="outline" className="text-[10px]">{ACCT_TYPES[bank.account_type]}</Badge>
                                                            {bank.is_default && <Badge variant="default" className="text-[10px]">Predeterminada</Badge>}
                                                            {!bank.active && <Badge variant="destructive" className="text-[10px]">Inactiva</Badge>}
                                                        </div>
                                                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{bank.account_number}</p>
                                                        {bank.account_holder && <p className="text-xs text-muted-foreground">{bank.account_holder}</p>}
                                                        <div className="flex gap-3 text-xs text-muted-foreground">
                                                            {bank.swift_code && <span>SWIFT: {bank.swift_code}</span>}
                                                            {bank.iban && <span>IBAN: {bank.iban}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 gap-1">
                                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setShowBankForm(false); setEditingBank(bank); }}>Editar</Button>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => del(`/contacts/${contact.id}/bank-details/${bank.id}`)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {/* Términos de Pago */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">Términos de Pago <Badge variant="secondary" className="ml-2">{contact.paymentTerms.length}</Badge></CardTitle>
                                        {!showTermForm && !editingTerm && <Button variant="outline" size="sm" className="flex items-center gap-1.5" onClick={() => setShowTermForm(true)}><Plus className="h-3.5 w-3.5" />Agregar término</Button>}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    {showTermForm && <PaymentTermForm contactId={contact.id} editing={null} onCancel={() => setShowTermForm(false)} />}
                                    {contact.paymentTerms.length === 0 && !showTermForm && <p className="text-sm text-muted-foreground">Sin términos de pago registrados.</p>}
                                    {contact.paymentTerms.map(term => (
                                        <div key={term.id}>
                                            {editingTerm?.id === term.id
                                                ? <PaymentTermForm contactId={contact.id} editing={term} onCancel={() => setEditingTerm(null)} />
                                                : <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium">{term.term_name}</span>
                                                            {term.is_default && <Badge variant="default" className="text-[10px]">Predeterminado</Badge>}
                                                        </div>
                                                        <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground mt-0.5">
                                                            <span>{term.days_to_pay} días para pagar</span>
                                                            {term.early_payment_discount && <span>Descuento pronto pago: {term.early_payment_discount}%</span>}
                                                            {term.late_payment_interest  && <span>Mora: {term.late_payment_interest}%</span>}
                                                        </div>
                                                        {term.notes && <p className="text-xs text-muted-foreground mt-0.5">{term.notes}</p>}
                                                    </div>
                                                    <div className="flex shrink-0 gap-1">
                                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setShowTermForm(false); setEditingTerm(term); }}>Editar</Button>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => del(`/contacts/${contact.id}/payment-terms/${term.id}`)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── TAB: COMUNICACIONES ─────────────────────────────── */}
                        <TabsContent value="communications">
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="h-4 w-4" />Comunicaciones</CardTitle>
                                        <div className="flex gap-2">
                                            <Link href={`/contacts/${contact.id}/communications`}><Button variant="outline" size="sm">Ver historial completo</Button></Link>
                                            {!showCommForm && <Button size="sm" className="flex items-center gap-1.5" onClick={() => setShowCommForm(true)}><Plus className="h-3.5 w-3.5" />Registrar</Button>}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    {showCommForm && <CommForm contactId={contact.id} onCancel={() => setShowCommForm(false)} />}
                                    {contact.communications.length === 0 && !showCommForm && <p className="text-sm text-muted-foreground">Sin comunicaciones registradas.</p>}
                                    {contact.communications.map(comm => (
                                        <div key={comm.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="outline" className="text-[10px]">{COMM_TYPES[comm.type] ?? comm.type}</Badge>
                                                    {comm.outcome && <Badge variant="secondary" className="text-[10px]">{COMM_OUTCOMES[comm.outcome] ?? comm.outcome}</Badge>}
                                                    <span className="text-xs text-muted-foreground">{comm.communication_date}</span>
                                                    {comm.user && <span className="text-xs text-muted-foreground">por {comm.user.name}</span>}
                                                </div>
                                                {comm.subject && <p className="text-sm font-medium mt-0.5">{comm.subject}</p>}
                                                <p className="text-xs text-muted-foreground line-clamp-2">{comm.content}</p>
                                                {comm.follow_up_date && <p className="text-xs text-amber-600 mt-0.5">Seguimiento: {comm.follow_up_date}</p>}
                                            </div>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive shrink-0" onClick={() => del(`/contacts/${contact.id}/communications/${comm.id}`)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── TAB: DOCUMENTOS ─────────────────────────────────── */}
                        <TabsContent value="documents">
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" />Documentos</CardTitle>
                                        {!showDocForm && <Button size="sm" className="flex items-center gap-1.5" onClick={() => setShowDocForm(true)}><Plus className="h-3.5 w-3.5" />Subir documento</Button>}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    {showDocForm && <DocUploadForm contactId={contact.id} onCancel={() => setShowDocForm(false)} />}
                                    {contact.documents.length === 0 && !showDocForm && <p className="text-sm text-muted-foreground">Sin documentos adjuntos.</p>}
                                    {contact.documents.map(doc => (
                                        <div key={doc.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="outline" className="text-[10px]">{DOC_TYPES[doc.document_type] ?? doc.document_type}</Badge>
                                                    <Badge variant="secondary" className="text-[10px] font-mono">{doc.file_type.toUpperCase()}</Badge>
                                                    <span className="text-xs text-muted-foreground">{fmtBytes(doc.file_size)}</span>
                                                    {doc.document_date && <span className="text-xs text-muted-foreground">{doc.document_date}</span>}
                                                </div>
                                                <p className="text-sm font-medium mt-0.5 truncate">{doc.document_name}</p>
                                                {doc.expiry_date && <p className="text-xs text-amber-600">Vence: {doc.expiry_date}</p>}
                                                {doc.notes && <p className="text-xs text-muted-foreground">{doc.notes}</p>}
                                            </div>
                                            <div className="flex shrink-0 gap-1">
                                                <a href={`/contacts/${contact.id}/documents/${doc.id}/download`} target="_blank">
                                                    <Button variant="outline" size="sm" className="h-7 text-xs">Descargar</Button>
                                                </a>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => del(`/contacts/${contact.id}/documents/${doc.id}`)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── TAB: ETIQUETAS ──────────────────────────────────── */}
                        <TabsContent value="tags">
                            <Card>
                                <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Tag className="h-4 w-4" />Etiquetas</CardTitle></CardHeader>
                                <CardContent>
                                    {allTags.length === 0 ? (
                                        <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
                                            <Tag className="h-6 w-6 opacity-30" />
                                            <p className="text-sm">No hay etiquetas creadas. <Link href="/contacts/tags" className="text-primary underline">Crear etiquetas</Link></p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-3">
                                            {allTags.map(tag => {
                                                const checked = contactTagIds.includes(tag.id);
                                                return (
                                                    <label key={tag.id} className="flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 hover:bg-muted/50 transition-colors">
                                                        <Checkbox checked={checked} onCheckedChange={v => toggleTag(tag.id, v === true)} />
                                                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                                                        <span className="text-sm">{tag.name}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <div className="mt-4 flex justify-end">
                                        <Link href="/contacts/tags"><Button variant="outline" size="sm">Gestionar etiquetas</Button></Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── TAB: PROVEEDOR ──────────────────────────────────── */}
                        {contact.is_supplier && (
                            <TabsContent value="supplier">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2 text-base"><Star className="h-4 w-4" />Evaluación de Proveedor</CardTitle>
                                            <Link href={`/contacts/${contact.id}/supplier-evaluation`}><Button size="sm">{contact.supplierEvaluation ? 'Actualizar evaluación' : 'Realizar evaluación'}</Button></Link>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {contact.supplierEvaluation ? (
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="flex flex-col gap-3">
                                                    {[
                                                        { label: 'Calidad', value: contact.supplierEvaluation.quality_rating },
                                                        { label: 'Entregas', value: contact.supplierEvaluation.delivery_rating },
                                                        { label: 'Comunicación', value: contact.supplierEvaluation.communication_rating },
                                                        { label: 'Precio', value: contact.supplierEvaluation.price_rating },
                                                    ].map(item => (
                                                        <div key={item.label} className="flex items-center justify-between">
                                                            <span className="text-sm text-muted-foreground">{item.label}</span>
                                                            <StarRating value={item.value} />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="rounded-lg border p-4 flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">Rating general</span>
                                                        <span className="text-2xl font-bold text-amber-500">{contact.supplierEvaluation.overall_rating.toFixed(1)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Entregas a tiempo</span>
                                                        <span>{contact.supplierEvaluation.on_time_delivery_percent}%</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">Tasa de defectos</span>
                                                        <span>{contact.supplierEvaluation.defect_rate}%</span>
                                                    </div>
                                                    {contact.supplierEvaluation.average_delivery_days && (
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-muted-foreground">Días promedio entrega</span>
                                                            <span>{contact.supplierEvaluation.average_delivery_days} días</span>
                                                        </div>
                                                    )}
                                                    {contact.supplierEvaluation.last_evaluation_date && (
                                                        <p className="text-xs text-muted-foreground mt-1">Última evaluación: {contact.supplierEvaluation.last_evaluation_date}</p>
                                                    )}
                                                </div>
                                                {contact.supplierEvaluation.notes && (
                                                    <div className="sm:col-span-2 rounded-lg bg-muted/30 p-3">
                                                        <p className="text-xs text-muted-foreground">{contact.supplierEvaluation.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
                                                <Star className="h-8 w-8 opacity-30" />
                                                <p className="text-sm">Este proveedor aún no tiene evaluación.</p>
                                                <Link href={`/contacts/${contact.id}/supplier-evaluation`}>
                                                    <Button variant="outline" size="sm">Realizar primera evaluación</Button>
                                                </Link>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}
                    </Tabs>
                ) : (
                    /* ── CREAR (sin tabs) ──────────────────────────────────────── */
                    <form onSubmit={submit} className="flex flex-col gap-6">
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Información general</CardTitle></CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-1.5"><Label htmlFor="name">Nombre comercial *</Label><Input id="name" placeholder="Distribuidora López S.A." value={data.name} onChange={e => setData('name', e.target.value)} />{errors.name && <p className="text-xs text-destructive">{errors.name}</p>}</div>
                                <div className="flex flex-col gap-1.5"><Label htmlFor="legal_name">Razón social</Label><Input id="legal_name" placeholder="Distribuidora López Honduras S. de R.L." value={data.legal_name} onChange={e => setData('legal_name', e.target.value)} /></div>
                                <div className="flex flex-col gap-1.5"><Label htmlFor="rtn">RTN <span className="text-muted-foreground">(14 dígitos)</span></Label><Input id="rtn" placeholder="08011999123456" maxLength={20} className="font-mono" value={data.rtn} onChange={e => setData('rtn', e.target.value.replace(/\D/g, ''))} />{errors.rtn && <p className="text-xs text-destructive">{errors.rtn}</p>}</div>
                                <div className="flex flex-col gap-1.5"><Label htmlFor="dni">DNI</Label><Input id="dni" placeholder="0801-1999-12345" maxLength={15} className="font-mono" value={data.dni} onChange={e => setData('dni', e.target.value)} /></div>
                                <div className="flex flex-col gap-1.5"><Label htmlFor="email">Correo electrónico</Label><Input id="email" type="email" placeholder="contacto@empresa.com" value={data.email} onChange={e => setData('email', e.target.value)} />{errors.email && <p className="text-xs text-destructive">{errors.email}</p>}</div>
                                <div className="flex flex-col gap-1.5"><Label htmlFor="phone">Teléfono fijo</Label><Input id="phone" placeholder="2222-3333" value={data.phone} onChange={e => setData('phone', e.target.value)} /></div>
                                <div className="flex flex-col gap-1.5"><Label htmlFor="mobile">Teléfono móvil</Label><Input id="mobile" placeholder="9999-8888" value={data.mobile} onChange={e => setData('mobile', e.target.value)} /></div>
                                <div className="flex flex-col gap-1.5"><Label htmlFor="website">Sitio web</Label><Input id="website" type="url" placeholder="https://empresa.com" value={data.website} onChange={e => setData('website', e.target.value)} />{errors.website && <p className="text-xs text-destructive">{errors.website}</p>}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Categorización</CardTitle></CardHeader>
                            <CardContent className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-2"><Checkbox id="is_client" checked={data.is_client} onCheckedChange={v => setData('is_client', v === true)} /><Label htmlFor="is_client" className="cursor-pointer">Cliente</Label></div>
                                <div className="flex items-center gap-2"><Checkbox id="is_supplier" checked={data.is_supplier} onCheckedChange={v => setData('is_supplier', v === true)} /><Label htmlFor="is_supplier" className="cursor-pointer">Proveedor</Label></div>
                                <div className="flex items-center gap-2"><Checkbox id="is_employee" checked={data.is_employee} onCheckedChange={v => setData('is_employee', v === true)} /><Label htmlFor="is_employee" className="cursor-pointer">Empleado</Label></div>
                                <div className="flex items-center gap-2 border-l pl-6"><Checkbox id="active" checked={data.active} onCheckedChange={v => setData('active', v === true)} /><Label htmlFor="active" className="cursor-pointer">Activo</Label></div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Notas internas</CardTitle></CardHeader>
                            <CardContent>
                                <textarea className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                                    placeholder="Observaciones, condiciones especiales…" value={data.notes} onChange={e => setData('notes', e.target.value)} rows={3} />
                            </CardContent>
                        </Card>
                        <div className="flex justify-end gap-3">
                            <Link href="/contacts"><Button type="button" variant="outline">Cancelar</Button></Link>
                            <Button type="submit" disabled={processing}>{processing ? <><Spinner className="mr-1" />Guardando…</> : 'Crear contacto'}</Button>
                        </div>
                    </form>
                )}
            </div>
        </>
    );
}

ContactForm.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Contactos', href: '/contacts' },
        { title: 'Detalle', href: '#' },
    ],
};
