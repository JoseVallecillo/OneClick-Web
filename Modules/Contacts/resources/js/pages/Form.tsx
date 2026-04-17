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
import { dashboard } from '@/routes';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, MapPin, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PersonRow {
    id: number;
    name: string;
    role: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    notes: string | null;
}

interface AddressRow {
    id: number;
    type: 'billing' | 'delivery' | 'other';
    label: string | null;
    address_line: string;
    city: string | null;
    state: string | null;
    country: string;
    postal_code: string | null;
    is_default: boolean;
}

interface ContactDetail {
    id: number;
    name: string;
    legal_name: string | null;
    rtn: string | null;
    dni: string | null;
    email: string | null;
    phone: string | null;
    mobile: string | null;
    website: string | null;
    is_client: boolean;
    is_supplier: boolean;
    is_employee: boolean;
    notes: string | null;
    active: boolean;
    addresses: AddressRow[];
    persons: PersonRow[];
}

interface Props {
    contact: ContactDetail | null;
}

// ── Address type labels ────────────────────────────────────────────────────────

const ADDRESS_TYPE_LABELS: Record<AddressRow['type'], string> = {
    billing:  'Facturación',
    delivery: 'Entrega',
    other:    'Otra',
};

// ── Address form (inline) ──────────────────────────────────────────────────────

function AddressForm({
    contactId,
    editing,
    onCancel,
}: {
    contactId: number;
    editing: AddressRow | null;
    onCancel: () => void;
}) {
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        type:         (editing?.type ?? 'billing') as AddressRow['type'],
        label:        editing?.label ?? '',
        address_line: editing?.address_line ?? '',
        city:         editing?.city ?? '',
        state:        editing?.state ?? '',
        country:      editing?.country ?? 'Honduras',
        postal_code:  editing?.postal_code ?? '',
        is_default:   editing?.is_default ?? false,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            patch(`/contacts/${contactId}/addresses/${editing.id}`, {
                onSuccess: () => onCancel(),
            });
        } else {
            post(`/contacts/${contactId}/addresses`, {
                onSuccess: () => { reset(); onCancel(); },
            });
        }
    }

    return (
        <form onSubmit={submit} className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Type */}
                <div className="flex flex-col gap-1.5">
                    <Label>Tipo</Label>
                    <Select
                        value={data.type}
                        onValueChange={(v) => setData('type', v as AddressRow['type'])}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="billing">Facturación</SelectItem>
                            <SelectItem value="delivery">Entrega</SelectItem>
                            <SelectItem value="other">Otra</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Label */}
                <div className="flex flex-col gap-1.5">
                    <Label>Etiqueta <span className="text-muted-foreground">(opcional)</span></Label>
                    <Input
                        placeholder="Oficina central, Bodega norte…"
                        value={data.label}
                        onChange={(e) => setData('label', e.target.value)}
                    />
                </div>

                {/* Address line */}
                <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
                    <Label>Dirección *</Label>
                    <Input
                        placeholder="Calle, número, colonia…"
                        value={data.address_line}
                        onChange={(e) => setData('address_line', e.target.value)}
                    />
                    {errors.address_line && <p className="text-xs text-destructive">{errors.address_line}</p>}
                </div>

                {/* City */}
                <div className="flex flex-col gap-1.5">
                    <Label>Ciudad</Label>
                    <Input
                        placeholder="Tegucigalpa"
                        value={data.city}
                        onChange={(e) => setData('city', e.target.value)}
                    />
                </div>

                {/* State / Department */}
                <div className="flex flex-col gap-1.5">
                    <Label>Departamento / Estado</Label>
                    <Input
                        placeholder="Francisco Morazán"
                        value={data.state}
                        onChange={(e) => setData('state', e.target.value)}
                    />
                </div>

                {/* Country */}
                <div className="flex flex-col gap-1.5">
                    <Label>País</Label>
                    <Input
                        value={data.country}
                        onChange={(e) => setData('country', e.target.value)}
                    />
                </div>
            </div>

            {/* Default flag */}
            <div className="flex items-center gap-2">
                <Checkbox
                    id="addr_default"
                    checked={data.is_default}
                    onCheckedChange={(v) => setData('is_default', v === true)}
                />
                <Label htmlFor="addr_default" className="cursor-pointer">
                    Usar como dirección predeterminada para este tipo
                </Label>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={processing}>
                    {processing ? <><Spinner className="mr-1 h-3 w-3" />Guardando…</> : editing ? 'Actualizar' : 'Agregar dirección'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                    Cancelar
                </Button>
            </div>
        </form>
    );
}

// ── Addresses section ──────────────────────────────────────────────────────────

function AddressesSection({ contact }: { contact: ContactDetail }) {
    const [showForm, setShowForm]       = useState(false);
    const [editingAddr, setEditingAddr] = useState<AddressRow | null>(null);
    const [deletingId, setDeletingId]   = useState<number | null>(null);

    function deleteAddress(addr: AddressRow) {
        if (!confirm('¿Eliminar esta dirección?')) return;
        setDeletingId(addr.id);
        router.delete(`/contacts/${contact.id}/addresses/${addr.id}`, {
            onFinish: () => setDeletingId(null),
        });
    }

    function startEdit(addr: AddressRow) {
        setShowForm(false);
        setEditingAddr(addr);
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <MapPin className="h-4 w-4" />
                        Direcciones
                        <Badge variant="secondary" className="ml-1">{contact.addresses.length}</Badge>
                    </CardTitle>
                    {!showForm && !editingAddr && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1.5"
                            onClick={() => setShowForm(true)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Agregar
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                {/* New address form */}
                {showForm && (
                    <AddressForm
                        contactId={contact.id}
                        editing={null}
                        onCancel={() => setShowForm(false)}
                    />
                )}

                {/* Existing addresses */}
                {contact.addresses.length === 0 && !showForm && (
                    <p className="text-sm text-muted-foreground">
                        Sin direcciones registradas. Agrega una dirección de facturación o entrega.
                    </p>
                )}

                {contact.addresses.map((addr) => (
                    <div key={addr.id}>
                        {editingAddr?.id === addr.id ? (
                            <AddressForm
                                contactId={contact.id}
                                editing={addr}
                                onCancel={() => setEditingAddr(null)}
                            />
                        ) : (
                            <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px]">
                                            {ADDRESS_TYPE_LABELS[addr.type]}
                                        </Badge>
                                        {addr.is_default && (
                                            <Badge variant="default" className="text-[10px]">Predeterminada</Badge>
                                        )}
                                        {addr.label && (
                                            <span className="text-xs font-medium">{addr.label}</span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm">{addr.address_line}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {[addr.city, addr.state, addr.country]
                                            .filter(Boolean)
                                            .join(', ')}
                                        {addr.postal_code && ` — ${addr.postal_code}`}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => startEdit(addr)}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                        disabled={deletingId === addr.id}
                                        onClick={() => deleteAddress(addr)}
                                    >
                                        {deletingId === addr.id
                                            ? <Spinner className="h-3 w-3" />
                                            : <Trash2 className="h-3.5 w-3.5" />
                                        }
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

// ── Person form (inline) ──────────────────────────────────────────────────────

function PersonForm({
    contactId,
    editing,
    onCancel,
}: {
    contactId: number;
    editing: PersonRow | null;
    onCancel: () => void;
}) {
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        name:   editing?.name   ?? '',
        role:   editing?.role   ?? '',
        email:  editing?.email  ?? '',
        phone:  editing?.phone  ?? '',
        mobile: editing?.mobile ?? '',
        notes:  editing?.notes  ?? '',
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            patch(`/contacts/${contactId}/persons/${editing.id}`, {
                onSuccess: () => onCancel(),
            });
        } else {
            post(`/contacts/${contactId}/persons`, {
                onSuccess: () => { reset(); onCancel(); },
            });
        }
    }

    return (
        <form onSubmit={submit} className="rounded-lg border bg-muted/20 p-4 flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                    <Label>Nombre *</Label>
                    <Input
                        placeholder="María García"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Cargo <span className="text-muted-foreground">(opcional)</span></Label>
                    <Input
                        placeholder="Gerente de Ventas"
                        value={data.role}
                        onChange={(e) => setData('role', e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Correo</Label>
                    <Input
                        type="email"
                        placeholder="maria@empresa.com"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Teléfono</Label>
                    <Input
                        placeholder="2222-3333"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Móvil</Label>
                    <Input
                        placeholder="9999-8888"
                        value={data.mobile}
                        onChange={(e) => setData('mobile', e.target.value)}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label>Notas <span className="text-muted-foreground">(opcional)</span></Label>
                    <Input
                        placeholder="Disponible lunes a viernes…"
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                    />
                </div>
            </div>
            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={processing}>
                    {processing ? <><Spinner className="mr-1 h-3 w-3" />Guardando…</> : editing ? 'Actualizar' : 'Agregar persona'}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                    Cancelar
                </Button>
            </div>
        </form>
    );
}

// ── Persons section ────────────────────────────────────────────────────────────

function PersonsSection({ contact }: { contact: ContactDetail }) {
    const [showForm, setShowForm]           = useState(false);
    const [editingPerson, setEditingPerson] = useState<PersonRow | null>(null);
    const [deletingId, setDeletingId]       = useState<number | null>(null);

    function deletePerson(person: PersonRow) {
        if (!confirm('¿Eliminar esta persona de contacto?')) return;
        setDeletingId(person.id);
        router.delete(`/contacts/${contact.id}/persons/${person.id}`, {
            onFinish: () => setDeletingId(null),
        });
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        Personas de contacto
                        <Badge variant="secondary" className="ml-1">{contact.persons.length}</Badge>
                    </CardTitle>
                    {!showForm && !editingPerson && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1.5"
                            onClick={() => setShowForm(true)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Agregar
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                {showForm && (
                    <PersonForm
                        contactId={contact.id}
                        editing={null}
                        onCancel={() => setShowForm(false)}
                    />
                )}

                {contact.persons.length === 0 && !showForm && (
                    <p className="text-sm text-muted-foreground">
                        Sin personas registradas. Agrega representantes, ejecutivos o personas de contacto.
                    </p>
                )}

                {contact.persons.map((person) => (
                    <div key={person.id}>
                        {editingPerson?.id === person.id ? (
                            <PersonForm
                                contactId={contact.id}
                                editing={person}
                                onCancel={() => setEditingPerson(null)}
                            />
                        ) : (
                            <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{person.name}</span>
                                        {person.role && (
                                            <Badge variant="outline" className="text-[10px]">{person.role}</Badge>
                                        )}
                                    </div>
                                    <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                                        {person.email  && <span>{person.email}</span>}
                                        {person.phone  && <span>{person.phone}</span>}
                                        {person.mobile && <span>{person.mobile}</span>}
                                    </div>
                                    {person.notes && (
                                        <p className="mt-1 text-xs text-muted-foreground">{person.notes}</p>
                                    )}
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => { setShowForm(false); setEditingPerson(person); }}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                        disabled={deletingId === person.id}
                                        onClick={() => deletePerson(person)}
                                    >
                                        {deletingId === person.id
                                            ? <Spinner className="h-3 w-3" />
                                            : <Trash2 className="h-3.5 w-3.5" />
                                        }
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ContactForm({ contact }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash     = props.flash;
    const isEdit    = contact !== null;

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
        if (isEdit) {
            patch(`/contacts/${contact.id}`);
        } else {
            post('/contacts');
        }
    }

    return (
        <>
            <Head title={isEdit ? `Editar: ${contact.name}` : 'Nuevo Contacto'} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href="/contacts">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 pl-1">
                            <ArrowLeft className="h-4 w-4" />
                            Contactos
                        </Button>
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <h1 className="text-lg font-semibold">
                        {isEdit ? contact.name : 'Nuevo Contacto'}
                    </h1>
                </div>

                {/* Flash */}
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                        {flash.error}
                    </div>
                )}

                <form onSubmit={submit} className="flex flex-col gap-6">
                    {/* ── Información general ──────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Información general</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            {/* Name */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="name">Nombre comercial / Nombre completo *</Label>
                                <Input
                                    id="name"
                                    placeholder="Distribuidora López S.A. / Juan López"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                            </div>

                            {/* Legal name */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="legal_name">Razón social <span className="text-muted-foreground">(opcional)</span></Label>
                                <Input
                                    id="legal_name"
                                    placeholder="Distribuidora López Honduras S. de R.L."
                                    value={data.legal_name}
                                    onChange={(e) => setData('legal_name', e.target.value)}
                                />
                            </div>

                            {/* RTN */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="rtn">RTN <span className="text-muted-foreground">(14 dígitos)</span></Label>
                                <Input
                                    id="rtn"
                                    placeholder="08011999123456"
                                    maxLength={20}
                                    className="font-mono"
                                    value={data.rtn}
                                    onChange={(e) => setData('rtn', e.target.value.replace(/\D/g, ''))}
                                />
                                {errors.rtn && <p className="text-xs text-destructive">{errors.rtn}</p>}
                            </div>

                            {/* DNI */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="dni">DNI <span className="text-muted-foreground">(cédula)</span></Label>
                                <Input
                                    id="dni"
                                    placeholder="0801-1999-12345"
                                    maxLength={15}
                                    className="font-mono"
                                    value={data.dni}
                                    onChange={(e) => setData('dni', e.target.value)}
                                />
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="email">Correo electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="contacto@empresa.com"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                            </div>

                            {/* Phone */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="phone">Teléfono fijo</Label>
                                <Input
                                    id="phone"
                                    placeholder="2222-3333"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                />
                            </div>

                            {/* Mobile */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="mobile">Teléfono móvil</Label>
                                <Input
                                    id="mobile"
                                    placeholder="9999-8888"
                                    value={data.mobile}
                                    onChange={(e) => setData('mobile', e.target.value)}
                                />
                            </div>

                            {/* Website */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="website">Sitio web</Label>
                                <Input
                                    id="website"
                                    type="url"
                                    placeholder="https://empresa.com"
                                    value={data.website}
                                    onChange={(e) => setData('website', e.target.value)}
                                />
                                {errors.website && <p className="text-xs text-destructive">{errors.website}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Categorización ───────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Categorización</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-6">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is_client"
                                    checked={data.is_client}
                                    onCheckedChange={(v) => setData('is_client', v === true)}
                                />
                                <Label htmlFor="is_client" className="cursor-pointer">Cliente</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is_supplier"
                                    checked={data.is_supplier}
                                    onCheckedChange={(v) => setData('is_supplier', v === true)}
                                />
                                <Label htmlFor="is_supplier" className="cursor-pointer">Proveedor</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is_employee"
                                    checked={data.is_employee}
                                    onCheckedChange={(v) => setData('is_employee', v === true)}
                                />
                                <Label htmlFor="is_employee" className="cursor-pointer">Empleado</Label>
                            </div>
                            <div className="flex items-center gap-2 border-l pl-6">
                                <Checkbox
                                    id="active"
                                    checked={data.active}
                                    onCheckedChange={(v) => setData('active', v === true)}
                                />
                                <Label htmlFor="active" className="cursor-pointer">Activo</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Notas ─────────────────────────────────────────────── */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Notas internas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                                placeholder="Observaciones, condiciones especiales, referencias…"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={3}
                            />
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex justify-end gap-3">
                        <Link href="/contacts">
                            <Button type="button" variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing
                                ? <><Spinner className="mr-1" />Guardando…</>
                                : isEdit ? 'Actualizar contacto' : 'Crear contacto'
                            }
                        </Button>
                    </div>
                </form>

                {/* ── Direcciones (solo en edición) ──────────────────────── */}
                {isEdit && <AddressesSection contact={contact} />}
                {isEdit && <PersonsSection contact={contact} />}
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
