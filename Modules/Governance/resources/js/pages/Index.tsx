import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock, KeyRound, Loader2, ShieldAlert, ShieldOff, Trash2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Rule {
    id: number;
    module_name: string;
    element_identifier: string;
    action_type: 'hide' | 'pin' | 'authorize';
    user_role: string | null;
    permission_key: string | null;
    pin_code: string | null;
    max_pin_attempts: number;
    active: boolean;
}

interface AuthRequest {
    id: number;
    token: string;
    module_name: string;
    element_identifier: string;
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    expires_at: string | null;
    created_at: string;
    user: { id: number; name: string; email: string };
}

interface FieldValidator {
    id: number;
    module_name: string;
    field_identifier: string;
    validation_type: 'numeric' | 'alpha' | 'alpha-dash' | 'alphanumeric';
    user_role: string | null;
    active: boolean;
}

interface Props {
    modules: string[];
    rules: Rule[];
    pendingRequests: AuthRequest[];
    fieldValidators: FieldValidator[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const VALIDATION_LABELS: Record<FieldValidator['validation_type'], string> = {
    numeric:        'Numérico (0-9)',
    alpha:          'Alfabético (a-z, espacios)',
    'alpha-dash':   'Alfabético-Guion (a-z, -, espacios)',
    alphanumeric:   'Alfanumérico (a-z, 0-9)',
};

const ACTION_LABELS: Record<Rule['action_type'], string> = {
    hide: 'Ocultar',
    pin: 'Requerir PIN',
    authorize: 'Requerir Autorización',
};

const ACTION_BADGE_VARIANT: Record<Rule['action_type'], 'default' | 'secondary' | 'destructive'> = {
    hide: 'destructive',
    pin: 'secondary',
    authorize: 'default',
};

function formatExpiry(expiresAt: string | null): string {
    if (!expiresAt) return '—';
    const diff = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));
    if (diff === 0) return 'Expirado';
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function GovernanceIndex({ modules, rules, pendingRequests, fieldValidators }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const { data, setData, post, processing, errors, reset } = useForm({
        module_name:        modules[0] ?? '',
        element_identifier: '',
        action_type:        'hide' as Rule['action_type'],
        user_role:          '' as string,
        permission_key:     '',
        pin_code:           '',
        max_pin_attempts:   3,
        active:             true,
    });

    const {
        data: fvData,
        setData: fvSetData,
        post: fvPost,
        processing: fvProcessing,
        errors: fvErrors,
        reset: fvReset,
    } = useForm({
        module_name:      modules[0] ?? '',
        field_identifier: '',
        validation_type:  'numeric' as FieldValidator['validation_type'],
        user_role:        '' as string,
        active:           true,
    });

    const [deletingId, setDeletingId]     = useState<number | null>(null);
    const [togglingId, setTogglingId]     = useState<number | null>(null);
    const [fvDeletingId, setFvDeletingId] = useState<number | null>(null);
    const [fvTogglingId, setFvTogglingId] = useState<number | null>(null);

    // ── Discovery State ────────────────────────────────────────────────────────
    const [discoveredRules, setDiscoveredRules] = useState<Record<string, string[]>>({});
    const [isLoadingRules, setIsLoadingRules]   = useState(false);
    const [selectedRuleModel, setSelectedRuleModel] = useState<string>('');

    const [discoveredFv, setDiscoveredFv]       = useState<Record<string, string[]>>({});
    const [isLoadingFv, setIsLoadingFv]         = useState(false);
    const [selectedFvModel, setSelectedFvModel] = useState<string>('');

    useEffect(() => {
        if (!data.module_name) return;
        setIsLoadingRules(true);
        fetch(`/governance/modules/${data.module_name}/elements`)
            .then(res => res.json())
            .then(json => {
                setDiscoveredRules(json.models || {});
                setSelectedRuleModel('');
            })
            .catch(() => setDiscoveredRules({}))
            .finally(() => setIsLoadingRules(false));
    }, [data.module_name]);

    useEffect(() => {
        if (!fvData.module_name) return;
        setIsLoadingFv(true);
        fetch(`/governance/modules/${fvData.module_name}/elements`)
            .then(res => res.json())
            .then(json => {
                setDiscoveredFv(json.models || {});
                setSelectedFvModel('');
            })
            .catch(() => setDiscoveredFv({}))
            .finally(() => setIsLoadingFv(false));
    }, [fvData.module_name]);

    function submitRule(e: React.FormEvent) {
        e.preventDefault();
        post('/governance/rules', {
            onSuccess: () => reset('element_identifier', 'pin_code'),
        });
    }

    function deleteRule(rule: Rule) {
        setDeletingId(rule.id);
        router.delete(`/governance/rules/${rule.id}`, { onFinish: () => setDeletingId(null) });
    }

    function toggleRule(rule: Rule) {
        setTogglingId(rule.id);
        router.patch(`/governance/rules/${rule.id}/toggle`, {}, { onFinish: () => setTogglingId(null) });
    }

    function submitFieldValidator(e: React.FormEvent) {
        e.preventDefault();
        fvPost('/governance/field-validators', {
            onSuccess: () => fvReset('field_identifier'),
        });
    }

    function toggleFieldValidator(fv: FieldValidator) {
        setFvTogglingId(fv.id);
        router.patch(`/governance/field-validators/${fv.id}/toggle`, {}, { onFinish: () => setFvTogglingId(null) });
    }

    function deleteFieldValidator(fv: FieldValidator) {
        setFvDeletingId(fv.id);
        router.delete(`/governance/field-validators/${fv.id}`, { onFinish: () => setFvDeletingId(null) });
    }

    function approveRequest(token: string) {
        router.post(`/governance/approve-authorization/${token}`);
    }

    function rejectRequest(token: string) {
        router.post(`/governance/reject-authorization/${token}`);
    }

    return (
        <>
            <Head title="Control de Aplicaciones" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Flash messages */}
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

                {/* ── Add Rule Form ──────────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldAlert className="h-4 w-4" />
                            Agregar Regla de Control de Aplicaciones
                        </CardTitle>
                        <CardDescription>
                            Controla botones y campos en módulos sin modificar su código fuente. Agrega un{' '}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">id</code> al elemento DOM y regístralo aquí.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={submitRule} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Module */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="module_name">Módulo</Label>
                                <Select value={data.module_name} onValueChange={(v) => setData('module_name', v)}>
                                    <SelectTrigger id="module_name" className="w-full">
                                        <SelectValue placeholder="Seleccionar módulo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {modules.map((m) => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.module_name && <p className="text-xs text-destructive">{errors.module_name}</p>}
                            </div>

                            {/* Model helper */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="rule_model">Modelo (Opcional)</Label>
                                <Select 
                                    value={selectedRuleModel} 
                                    onValueChange={setSelectedRuleModel}
                                    disabled={isLoadingRules || Object.keys(discoveredRules).length === 0}
                                >
                                    <SelectTrigger id="rule_model" className="w-full">
                                        <SelectValue placeholder={isLoadingRules ? "Cargando..." : "Explorar modelos..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Manual / Ninguno</SelectItem>
                                        {Object.keys(discoveredRules).map(m => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Element ID */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="element_identifier">ID del Elemento</Label>
                                {selectedRuleModel && selectedRuleModel !== '__none__' ? (
                                    <Select 
                                        value={data.element_identifier} 
                                        onValueChange={(v) => setData('element_identifier', v)}
                                    >
                                        <SelectTrigger id="element_identifier" className="w-full">
                                            <SelectValue placeholder="Seleccionar campo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {discoveredRules[selectedRuleModel]?.map(f => (
                                                <SelectItem key={f} value={f}>{f}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        id="element_identifier"
                                        placeholder="ej. guardar-factura"
                                        value={data.element_identifier}
                                        onChange={(e) => setData('element_identifier', e.target.value)}
                                    />
                                )}
                                {errors.element_identifier && <p className="text-xs text-destructive">{errors.element_identifier}</p>}
                            </div>

                            {/* Action type */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="action_type">Acción</Label>
                                <Select
                                    value={data.action_type}
                                    onValueChange={(v) => setData('action_type', v as Rule['action_type'])}
                                >
                                    <SelectTrigger id="action_type" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hide">Ocultar</SelectItem>
                                        <SelectItem value="pin">Requerir PIN</SelectItem>
                                        <SelectItem value="authorize">Requerir Autorización</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Role */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="user_role">Aplica a rol</Label>
                                <Select value={data.user_role || '__all__'} onValueChange={(v) => setData('user_role', v === '__all__' ? '' : v)}>
                                    <SelectTrigger id="user_role" className="w-full">
                                        <SelectValue placeholder="Todos los roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Todos los roles</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="user">User</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Permission key — optional, links to Profiles system */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="permission_key">Llave de permiso</Label>
                                <Input
                                    id="permission_key"
                                    placeholder="ej. ventas.eliminar (opcional)"
                                    className="font-mono text-xs"
                                    value={data.permission_key}
                                    onChange={(e) => setData('permission_key', e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Si se define, la regla solo aplica a usuarios que <strong>no</strong> tengan este permiso en su perfil.
                                </p>
                                {errors.permission_key && <p className="text-xs text-destructive">{errors.permission_key}</p>}
                            </div>

                            {/* PIN fields — only for pin action */}
                            {data.action_type === 'pin' && (
                                <>
                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="pin_code">Código PIN</Label>
                                        <Input
                                            id="pin_code"
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={10}
                                            placeholder="Establecer PIN"
                                            value={data.pin_code}
                                            onChange={(e) => setData('pin_code', e.target.value)}
                                        />
                                        {errors.pin_code && <p className="text-xs text-destructive">{errors.pin_code}</p>}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <Label htmlFor="max_pin_attempts">Máximos intentos de PIN</Label>
                                        <Input
                                            id="max_pin_attempts"
                                            type="number"
                                            min={1}
                                            max={10}
                                            value={data.max_pin_attempts}
                                            onChange={(e) => setData('max_pin_attempts', Number(e.target.value))}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            El usuario es bloqueado por 15 min después de esta cantidad de intentos erróneos.
                                        </p>
                                        {errors.max_pin_attempts && <p className="text-xs text-destructive">{errors.max_pin_attempts}</p>}
                                    </div>
                                </>
                            )}

                            {/* Active */}
                            <div className="flex items-center gap-2 self-end pb-1">
                                <Checkbox
                                    id="active"
                                    checked={data.active}
                                    onCheckedChange={(c) => setData('active', c === true)}
                                />
                                <Label htmlFor="active" className="cursor-pointer">Activo</Label>
                            </div>

                            {/* Submit */}
                            <div className="sm:col-span-2 lg:col-span-3">
                                <Button type="submit" disabled={processing}>
                                    {processing ? <><Spinner className="mr-1" /> Guardando…</> : 'Guardar Regla'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* ── Rule List ─────────────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldOff className="h-4 w-4" />
                            Reglas Activas
                            <Badge variant="secondary" className="ml-1">{rules.length}</Badge>
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        {rules.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aún no se han definido reglas de Control de Aplicaciones.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 pr-4 font-medium">Módulo</th>
                                            <th className="pb-2 pr-4 font-medium">ID del Elemento</th>
                                            <th className="pb-2 pr-4 font-medium">Acción</th>
                                            <th className="pb-2 pr-4 font-medium">Rol</th>
                                            <th className="pb-2 pr-4 font-medium">Llave de permiso</th>
                                            <th className="pb-2 pr-4 font-medium">Intentos de PIN</th>
                                            <th className="pb-2 pr-4 font-medium">Estado</th>
                                            <th className="pb-2 font-medium">Eliminar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rules.map((rule) => (
                                            <tr key={rule.id} className="border-b last:border-0">
                                                <td className="py-2 pr-4 font-mono text-xs">{rule.module_name}</td>
                                                <td className="py-2 pr-4 font-mono text-xs">#{rule.element_identifier}</td>
                                                <td className="py-2 pr-4">
                                                    <Badge variant={ACTION_BADGE_VARIANT[rule.action_type]}>
                                                        {ACTION_LABELS[rule.action_type]}
                                                    </Badge>
                                                </td>
                                                <td className="py-2 pr-4 capitalize text-muted-foreground">
                                                    {rule.user_role ?? 'Todos'}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    {rule.permission_key ? (
                                                        <Badge variant="secondary" className="font-mono text-[10px]">
                                                            {rule.permission_key}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="py-2 pr-4 text-muted-foreground">
                                                    {rule.action_type === 'pin' ? `Máx ${rule.max_pin_attempts}` : '—'}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    <button
                                                        onClick={() => toggleRule(rule)}
                                                        disabled={togglingId === rule.id}
                                                        className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70 disabled:opacity-50"
                                                    >
                                                        {togglingId === rule.id ? (
                                                            <Spinner className="h-3 w-3" />
                                                        ) : rule.active ? (
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                                        ) : (
                                                            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                                        )}
                                                        {rule.active ? 'Activo' : 'Inactivo'}
                                                    </button>
                                                </td>
                                                <td className="py-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                        disabled={deletingId === rule.id}
                                                        onClick={() => deleteRule(rule)}
                                                    >
                                                        {deletingId === rule.id
                                                            ? <Spinner className="h-3 w-3" />
                                                            : <Trash2 className="h-3.5 w-3.5" />
                                                        }
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Field Validators ──────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <KeyRound className="h-4 w-4" />
                            Validadores de Campo
                            <Badge variant="secondary" className="ml-1">{fieldValidators.length}</Badge>
                        </CardTitle>
                        <CardDescription>
                            Asigna un tipo de validación a cualquier campo de entrada sin modificar su código fuente.
                            Usa <code className="rounded bg-muted px-1 py-0.5 text-xs">fieldId</code> +{' '}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">moduleName</code> en{' '}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">&lt;ValidatedInput&gt;</code>.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-6">
                        {/* Add validator form */}
                        <form onSubmit={submitFieldValidator} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="fv_module">Módulo</Label>
                                <Select value={fvData.module_name} onValueChange={(v) => fvSetData('module_name', v)}>
                                    <SelectTrigger id="fv_module" className="w-full">
                                        <SelectValue placeholder="Seleccionar módulo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {modules.map((m) => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fvErrors.module_name && <p className="text-xs text-destructive">{fvErrors.module_name}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="fv_model">Modelo (Opcional)</Label>
                                <Select 
                                    value={selectedFvModel} 
                                    onValueChange={setSelectedFvModel}
                                    disabled={isLoadingFv || Object.keys(discoveredFv).length === 0}
                                >
                                    <SelectTrigger id="fv_model" className="w-full">
                                        <SelectValue placeholder={isLoadingFv ? "Cargando..." : "Explorar modelos..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Manual / Ninguno</SelectItem>
                                        {Object.keys(discoveredFv).map(m => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="fv_field">ID del Campo</Label>
                                {selectedFvModel && selectedFvModel !== '__none__' ? (
                                    <Select 
                                        value={fvData.field_identifier} 
                                        onValueChange={(v) => fvSetData('field_identifier', v)}
                                    >
                                        <SelectTrigger id="fv_field" className="w-full">
                                            <SelectValue placeholder="Seleccionar campo..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {discoveredFv[selectedFvModel]?.map(f => (
                                                <SelectItem key={f} value={f}>{f}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        id="fv_field"
                                        placeholder="ej. id-socio"
                                        value={fvData.field_identifier}
                                        onChange={(e) => fvSetData('field_identifier', e.target.value)}
                                    />
                                )}
                                {fvErrors.field_identifier && <p className="text-xs text-destructive">{fvErrors.field_identifier}</p>}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="fv_type">Tipo de Validación</Label>
                                <Select
                                    value={fvData.validation_type}
                                    onValueChange={(v) => fvSetData('validation_type', v as FieldValidator['validation_type'])}
                                >
                                    <SelectTrigger id="fv_type" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="numeric">Numérico (0-9)</SelectItem>
                                        <SelectItem value="alpha">Alfabético (letras + espacios)</SelectItem>
                                        <SelectItem value="alpha-dash">Alfabético-Guion (letras, espacios, -)</SelectItem>
                                        <SelectItem value="alphanumeric">Alfanumérico (letras + números)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="fv_user_role">Aplica a rol</Label>
                                <Select value={fvData.user_role || '__all__'} onValueChange={(v) => fvSetData('user_role', v === '__all__' ? '' : v)}>
                                    <SelectTrigger id="fv_user_role" className="w-full">
                                        <SelectValue placeholder="Todos los roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">Todos los roles</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                        <SelectItem value="user">Usuario</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2 self-end pb-1">
                                <Checkbox
                                    id="fv_active"
                                    checked={fvData.active}
                                    onCheckedChange={(c) => fvSetData('active', c === true)}
                                />
                                <Label htmlFor="fv_active" className="cursor-pointer">Activo</Label>
                            </div>

                            <div className="sm:col-span-2 lg:col-span-3">
                                <Button type="submit" disabled={fvProcessing}>
                                    {fvProcessing ? <><Spinner className="mr-1" /> Guardando…</> : 'Guardar Validador'}
                                </Button>
                            </div>
                        </form>

                        {/* Validators table */}
                        {fieldValidators.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aún no se han definido validadores de campo.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-muted-foreground">
                                            <th className="pb-2 pr-4 font-medium">Módulo</th>
                                            <th className="pb-2 pr-4 font-medium">ID del Campo</th>
                                            <th className="pb-2 pr-4 font-medium">Validación</th>
                                            <th className="pb-2 pr-4 font-medium">Rol</th>
                                            <th className="pb-2 pr-4 font-medium">Estado</th>
                                            <th className="pb-2 font-medium">Eliminar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fieldValidators.map((fv) => (
                                            <tr key={fv.id} className="border-b last:border-0">
                                                <td className="py-2 pr-4 font-mono text-xs">{fv.module_name}</td>
                                                <td className="py-2 pr-4 font-mono text-xs">#{fv.field_identifier}</td>
                                                <td className="py-2 pr-4">
                                                    <Badge variant="secondary">{VALIDATION_LABELS[fv.validation_type]}</Badge>
                                                </td>
                                                <td className="py-2 pr-4 capitalize text-muted-foreground">
                                                    {fv.user_role ?? 'Todos'}
                                                </td>
                                                <td className="py-2 pr-4">
                                                    <button
                                                        onClick={() => toggleFieldValidator(fv)}
                                                        disabled={fvTogglingId === fv.id}
                                                        className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70 disabled:opacity-50"
                                                    >
                                                        {fvTogglingId === fv.id ? (
                                                            <Spinner className="h-3 w-3" />
                                                        ) : fv.active ? (
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                                        ) : (
                                                            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                                        )}
                                                        {fv.active ? 'Activo' : 'Inactivo'}
                                                    </button>
                                                </td>
                                                <td className="py-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                                        disabled={fvDeletingId === fv.id}
                                                        onClick={() => deleteFieldValidator(fv)}
                                                    >
                                                        {fvDeletingId === fv.id
                                                            ? <Spinner className="h-3 w-3" />
                                                            : <Trash2 className="h-3.5 w-3.5" />
                                                        }
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Pending Authorization Requests ────────────────────── */}
                {pendingRequests.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <ShieldAlert className="h-4 w-4 text-amber-500" />
                                Autorizaciones Pendientes
                                <Badge variant="destructive" className="ml-1">{pendingRequests.length}</Badge>
                            </CardTitle>
                            <CardDescription>
                                Usuarios esperando aprobación del supervisor. Las solicitudes expiran después de 5 minutos.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="flex flex-col gap-3">
                            {pendingRequests.map((req) => {
                                const expiry     = req.expires_at ? formatExpiry(req.expires_at) : null;
                                const isExpiring = req.expires_at
                                    ? Math.max(0, new Date(req.expires_at).getTime() - Date.now()) < 60_000
                                    : false;

                                return (
                                    <div
                                        key={req.id}
                                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-medium">{req.user.name}</span>
                                            <span className="text-xs text-muted-foreground">{req.user.email}</span>
                                            <span className="mt-1 font-mono text-xs text-muted-foreground">
                                                {req.module_name} → #{req.element_identifier}
                                            </span>
                                            {expiry && (
                                                <span className={`mt-1 flex items-center gap-1 text-xs font-medium ${isExpiring ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                    <Clock className="h-3 w-3" />
                                                    {expiry === 'Expirado' ? 'Expirado' : `Expira en ${expiry}`}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                                                onClick={() => approveRequest(req.token)}
                                            >
                                                Aprobar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => rejectRequest(req.token)}
                                            >
                                                Rechazar
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

GovernanceIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Control de Aplicaciones', href: '/governance' },
    ],
};
