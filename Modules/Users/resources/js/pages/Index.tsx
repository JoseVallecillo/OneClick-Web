import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { KeyRound, ListFilter, Plus, Search, ShieldCheck, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type Permissions = Record<string, boolean>;

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    profile_id: number | null;
    permissions: Permissions | null;
    email_verified_at: string | null;
    created_at: string;
    profile: { id: number; name: string } | null;
}

interface ProfileRow {
    id: number;
    name: string;
    permissions: Permissions | null;
    users_count: number;
}

interface Props {
    users: UserRow[];
    profiles: ProfileRow[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

type PermEntry = { key: string; value: boolean };

function toEntries(obj: Permissions | null): PermEntry[] {
    if (!obj) return [];
    return Object.entries(obj).map(([key, value]) => ({ key, value }));
}

function toObject(entries: PermEntry[]): Permissions {
    return Object.fromEntries(
        entries.filter((e) => e.key.trim() !== '').map((e) => [e.key.trim(), e.value]),
    );
}

// ── Permissions builder ────────────────────────────────────────────────────────

function PermissionsBuilder({
    value,
    onChange,
}: {
    value: Permissions | null;
    onChange: (v: Permissions | null) => void;
}) {
    const [entries, setEntries] = useState<PermEntry[]>(() => toEntries(value));

    function update(newEntries: PermEntry[]) {
        setEntries(newEntries);
        const obj = toObject(newEntries);
        onChange(Object.keys(obj).length > 0 ? obj : null);
    }

    return (
        <div className="flex flex-col gap-2">
            {entries.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Input
                        placeholder="ej. ventas.crear"
                        value={entry.key}
                        className="font-mono text-xs"
                        onChange={(e) =>
                            update(entries.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))
                        }
                    />
                    <Select
                        value={entry.value ? 'true' : 'false'}
                        onValueChange={(v) =>
                            update(entries.map((x, j) => (j === i ? { ...x, value: v === 'true' } : x)))
                        }
                    >
                        <SelectTrigger className="w-36">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="true">Permitido</SelectItem>
                            <SelectItem value="false">Denegado</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => update(entries.filter((_, j) => j !== i))}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit gap-1.5"
                onClick={() => update([...entries, { key: '', value: true }])}
            >
                <Plus className="h-3.5 w-3.5" />
                Agregar permiso
            </Button>
        </div>
    );
}

// ── Tab button ─────────────────────────────────────────────────────────────────

function TabButton({
    active,
    onClick,
    children,
    count,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    count?: number;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 border-b-2 px-4 pb-2 text-sm font-medium transition-colors ${
                active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
            {children}
            {count !== undefined && (
                <Badge variant={active ? 'default' : 'secondary'} className="text-xs">
                    {count}
                </Badge>
            )}
        </button>
    );
}

// ── Create user dialog ─────────────────────────────────────────────────────────

function CreateUserDialog({
    profiles,
    defaultRole,
}: {
    profiles: ProfileRow[];
    defaultRole: 'admin' | 'user';
}) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name:       '',
        email:      '',
        password:   '',
        role:       defaultRole as 'admin' | 'user',
        profile_id: '' as string,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/users', {
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4" />
                    Crear usuario
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Crear nuevo usuario</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="flex flex-col gap-4 pt-2">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cu_name">Nombre</Label>
                        <Input
                            id="cu_name"
                            placeholder="Nombre completo"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cu_email">Correo electrónico</Label>
                        <Input
                            id="cu_email"
                            type="email"
                            placeholder="correo@ejemplo.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                        />
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cu_password">Contraseña</Label>
                        <Input
                            id="cu_password"
                            type="password"
                            placeholder="Contraseña segura"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                        />
                        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="cu_role">Rol</Label>
                            <Select
                                value={data.role}
                                onValueChange={(v) => setData('role', v as 'admin' | 'user')}
                            >
                                <SelectTrigger id="cu_role" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    <SelectItem value="user">Usuario</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="cu_profile">Perfil</Label>
                            <Select
                                value={data.profile_id || '__none__'}
                                onValueChange={(v) => setData('profile_id', v === '__none__' ? '' : v)}
                            >
                                <SelectTrigger id="cu_profile" className="w-full">
                                    <SelectValue placeholder="Sin perfil" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Sin perfil</SelectItem>
                                    {profiles.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? (
                                <>
                                    <Spinner className="mr-1" /> Guardando…
                                </>
                            ) : (
                                'Crear usuario'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ── Exceptions dialog ──────────────────────────────────────────────────────────

function ExceptionsDialog({ user }: { user: UserRow }) {
    const [open, setOpen] = useState(false);
    const [perms, setPerms] = useState<Permissions | null>(user.permissions);
    const [saving, setSaving] = useState(false);

    const exceptionCount = Object.keys(user.permissions ?? {}).length;

    function save() {
        setSaving(true);
        router.patch(
            `/users/${user.id}/exceptions`,
            { permissions: perms },
            {
                onFinish: () => {
                    setSaving(false);
                    setOpen(false);
                },
            },
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <KeyRound className="h-3.5 w-3.5" />
                    {exceptionCount > 0 ? (
                        <Badge variant="secondary" className="text-[10px]">
                            {exceptionCount}
                        </Badge>
                    ) : (
                        'Ninguna'
                    )}
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Excepciones de permisos — {user.name}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 pt-2">
                    <p className="text-sm text-muted-foreground">
                        Estos permisos sobrescriben los del perfil asignado. Deja vacío para usar solo el perfil.
                    </p>
                    <PermissionsBuilder value={perms} onChange={setPerms} />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={save} disabled={saving}>
                            {saving ? (
                                <>
                                    <Spinner className="mr-1" /> Guardando…
                                </>
                            ) : (
                                'Guardar excepciones'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ── Users table ────────────────────────────────────────────────────────────────

function UsersTable({
    users,
    profiles,
    currentUserId,
}: {
    users: UserRow[];
    profiles: ProfileRow[];
    currentUserId: number;
}) {
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [confirmUser, setConfirmUser] = useState<UserRow | null>(null);

    function changeRole(user: UserRow, role: string) {
        setUpdatingId(user.id);
        router.patch(`/users/${user.id}/role`, { role }, { onFinish: () => setUpdatingId(null) });
    }

    function changeProfile(user: UserRow, profileId: string) {
        router.patch(`/users/${user.id}/profile`, {
            profile_id: profileId === '' ? null : Number(profileId),
        });
    }

    function executeDelete() {
        if (!confirmUser) return;
        setDeletingId(confirmUser.id);
        router.delete(`/users/${confirmUser.id}`, {
            onFinish: () => {
                setDeletingId(null);
                setConfirmUser(null);
            },
        });
    }

    if (users.length === 0) {
        return (
            <p className="py-6 text-center text-sm text-muted-foreground">
                No hay usuarios en esta categoría.
            </p>
        );
    }

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-2 pr-4 font-medium">Nombre</th>
                            <th className="pb-2 pr-4 font-medium">Correo</th>
                            <th className="pb-2 pr-4 font-medium">Perfil</th>
                            <th className="pb-2 pr-4 font-medium">Excepciones</th>
                            <th className="pb-2 pr-4 font-medium">Rol</th>
                            <th className="pb-2 pr-4 font-medium">Verificado</th>
                            <th className="pb-2 font-medium">Eliminar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => {
                            const isSelf     = user.id === currentUserId;
                            const isUpdating = updatingId === user.id;
                            const isDeleting = deletingId === user.id;

                            return (
                                <tr key={user.id} className="border-b last:border-0">
                                    <td className="py-2 pr-4 font-medium">
                                        {user.name}
                                        {isSelf && (
                                            <Badge variant="secondary" className="ml-2 text-[10px]">
                                                Tú
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="py-2 pr-4 text-xs text-muted-foreground">{user.email}</td>

                                    {/* Perfil */}
                                    <td className="py-2 pr-4">
                                        <Select
                                            value={user.profile_id ? String(user.profile_id) : '__none__'}
                                            onValueChange={(v) => changeProfile(user, v === '__none__' ? '' : v)}
                                        >
                                            <SelectTrigger className="h-7 w-36 text-xs">
                                                <SelectValue placeholder="Sin perfil" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">Sin perfil</SelectItem>
                                                {profiles.map((p) => (
                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                        {p.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </td>

                                    {/* Excepciones */}
                                    <td className="py-2 pr-4">
                                        <ExceptionsDialog user={user} />
                                    </td>

                                    {/* Rol */}
                                    <td className="py-2 pr-4">
                                        {isSelf ? (
                                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                                {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                                            </Badge>
                                        ) : (
                                            <Select
                                                value={user.role}
                                                onValueChange={(v) => changeRole(user, v)}
                                                disabled={isUpdating}
                                            >
                                                <SelectTrigger className="h-7 w-36 text-xs">
                                                    {isUpdating ? (
                                                        <span className="flex items-center gap-1">
                                                            <Spinner className="h-3 w-3" /> Actualizando…
                                                        </span>
                                                    ) : (
                                                        <SelectValue />
                                                    )}
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Administrador</SelectItem>
                                                    <SelectItem value="user">Usuario</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </td>

                                    {/* Verificado */}
                                    <td className="py-2 pr-4">
                                        {user.email_verified_at ? (
                                            <Badge variant="secondary" className="text-green-700 dark:text-green-400">
                                                Verificado
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive">Sin verificar</Badge>
                                        )}
                                    </td>

                                    {/* Eliminar */}
                                    <td className="py-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                            disabled={isSelf || isDeleting}
                                            onClick={() => setConfirmUser(user)}
                                            title={isSelf ? 'No puedes eliminarte a ti mismo' : 'Eliminar usuario'}
                                        >
                                            {isDeleting ? (
                                                <Spinner className="h-3 w-3" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Delete confirmation dialog */}
            <AlertDialog open={!!confirmUser} onOpenChange={(open) => !open && setConfirmUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar usuario</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar al usuario <strong>"{confirmUser?.name}"</strong>?
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            variant="destructive"
                        >
                            {deletingId ? (
                                <><Spinner className="mr-1 h-3 w-3" /> Eliminando…</>
                            ) : (
                                'Eliminar'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ── Profile form ───────────────────────────────────────────────────────────────

function ProfileForm({ profiles }: { profiles: ProfileRow[] }) {
    const [editingProfile, setEditingProfile] = useState<ProfileRow | null>(null);
    const [deletingId, setDeletingId]         = useState<number | null>(null);

    const { data, setData, post, patch, processing, errors, reset } = useForm<{
        name: string;
        permissions: Permissions | null;
    }>({
        name:        editingProfile?.name ?? '',
        permissions: editingProfile?.permissions ?? null,
    });

    function startEdit(profile: ProfileRow) {
        setEditingProfile(profile);
        setData({ name: profile.name, permissions: profile.permissions });
    }

    function cancelEdit() {
        setEditingProfile(null);
        reset();
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editingProfile) {
            patch(`/users/profiles/${editingProfile.id}`, { onSuccess: () => cancelEdit() });
        } else {
            post('/users/profiles', { onSuccess: () => reset() });
        }
    }

    const [confirmProfile, setConfirmProfile] = useState<ProfileRow | null>(null);

    function executeDeleteProfile() {
        if (!confirmProfile) return;
        setDeletingId(confirmProfile.id);
        router.delete(`/users/profiles/${confirmProfile.id}`, {
            onFinish: () => {
                setDeletingId(null);
                setConfirmProfile(null);
            },
        });
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Form */}
            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="pf_name">Nombre del perfil</Label>
                        <Input
                            id="pf_name"
                            placeholder="ej. Vendedor, Supervisor"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label>Permisos del perfil</Label>
                    <p className="text-xs text-muted-foreground">
                        Usa notación de punto: <code className="rounded bg-muted px-1 py-0.5 text-xs">modulo.accion</code>
                    </p>
                    <PermissionsBuilder
                        value={data.permissions}
                        onChange={(v) => setData('permissions', v)}
                    />
                    {errors.permissions && <p className="text-xs text-destructive">{errors.permissions}</p>}
                </div>

                <div className="flex items-center gap-2">
                    <Button type="submit" disabled={processing}>
                        {processing ? (
                            <>
                                <Spinner className="mr-1" /> Guardando…
                            </>
                        ) : editingProfile ? (
                            'Actualizar perfil'
                        ) : (
                            'Crear perfil'
                        )}
                    </Button>
                    {editingProfile && (
                        <Button type="button" variant="outline" onClick={cancelEdit}>
                            Cancelar
                        </Button>
                    )}
                </div>
            </form>

            {/* Profiles table */}
            {profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no se han creado perfiles.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-muted-foreground">
                                <th className="pb-2 pr-4 font-medium">Nombre</th>
                                <th className="pb-2 pr-4 font-medium">Permisos</th>
                                <th className="pb-2 pr-4 font-medium">Usuarios</th>
                                <th className="pb-2 pr-4 font-medium">Editar</th>
                                <th className="pb-2 font-medium">Eliminar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map((profile) => (
                                <tr
                                    key={profile.id}
                                    className={`border-b last:border-0 ${editingProfile?.id === profile.id ? 'bg-muted/40' : ''}`}
                                >
                                    <td className="py-2 pr-4 font-medium">{profile.name}</td>
                                    <td className="py-2 pr-4">
                                        {profile.permissions && Object.keys(profile.permissions).length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(profile.permissions).map(([key, val]) => (
                                                    <Badge
                                                        key={key}
                                                        variant={val ? 'secondary' : 'destructive'}
                                                        className="font-mono text-[10px]"
                                                    >
                                                        {key}: {val ? '✓' : '✗'}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Sin permisos</span>
                                        )}
                                    </td>
                                    <td className="py-2 pr-4 text-muted-foreground">{profile.users_count}</td>
                                    <td className="py-2 pr-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => startEdit(profile)}
                                        >
                                            Editar
                                        </Button>
                                    </td>
                                    <td className="py-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                            disabled={deletingId === profile.id}
                                            onClick={() => setConfirmProfile(profile)}
                                        >
                                            {deletingId === profile.id ? (
                                                <Spinner className="h-3 w-3" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Delete profile confirmation dialog */}
            <AlertDialog open={!!confirmProfile} onOpenChange={(open) => !open && setConfirmProfile(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar perfil</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar el perfil <strong>"{confirmProfile?.name}"</strong>?
                            Los {confirmProfile?.users_count ?? 0} usuarios asignados quedarán sin perfil.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDeleteProfile}
                            variant="destructive"
                        >
                            {deletingId ? (
                                <><Spinner className="mr-1 h-3 w-3" /> Eliminando…</>
                            ) : (
                                'Eliminar perfil'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function UsersIndex({ users = [], profiles = [] }: Props) {
    const { props } = usePage<{
        auth: { user?: { id: number } | null };
        flash?: { success?: string; error?: string };
    }>();
    const flash         = props.flash;
    const currentUserId = props.auth?.user?.id ?? 0;

    const [mainTab, setMainTab]   = useState<'users' | 'profiles'>('users');
    const [roleTab, setRoleTab]   = useState<'admin' | 'user'>('admin');

    const [search, setSearch]               = useState('');
    const [profileFilter, setProfileFilter] = useState('__all__');
    const [statusFilter, setStatusFilter]   = useState('__all__');

    // Local filtering logic
    const filtered = users.filter((u) => {
        // Tab role filter
        if (u.role !== roleTab) return false;

        // Search filter
        if (search) {
            const s = search.toLowerCase();
            if (!u.name.toLowerCase().includes(s) && !u.email.toLowerCase().includes(s)) {
                return false;
            }
        }

        // Profile filter
        if (profileFilter !== '__all__') {
            if (String(u.profile_id) !== profileFilter) return false;
        }

        // Status filter (Verified)
        if (statusFilter !== '__all__') {
            const isVerified = u.email_verified_at !== null;
            if (statusFilter === '1' && !isVerified) return false;
            if (statusFilter === '0' && isVerified) return false;
        }

        return true;
    });

    const admins       = users.filter((u) => u.role === 'admin');
    const regularUsers = users.filter((u) => u.role === 'user');
    const displayed    = filtered;

    return (
        <>
            <Head title="Gestión de Usuarios" />

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

                <Card>
                    {/* Main tabs header */}
                    <CardHeader className="pb-0">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex border-b w-full">
                                <TabButton
                                    active={mainTab === 'users'}
                                    onClick={() => setMainTab('users')}
                                    count={users.length}
                                >
                                    <Users className="h-3.5 w-3.5" />
                                    Usuarios
                                </TabButton>
                                <TabButton
                                    active={mainTab === 'profiles'}
                                    onClick={() => setMainTab('profiles')}
                                    count={profiles.length}
                                >
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Perfiles
                                </TabButton>
                            </div>
                            {mainTab === 'users' && (
                                <div className="shrink-0">
                                    <CreateUserDialog profiles={profiles} defaultRole={roleTab} />
                                </div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-4">
                        {/* ── USUARIOS TAB ─────────────────────────────── */}
                        {mainTab === 'users' && (
                            <>
                                <CardDescription className="mb-4">
                                    Asigna perfiles y excepciones individuales a cada usuario. Los permisos del perfil
                                    se heredan; las excepciones los sobreescriben.
                                </CardDescription>

                                {/* Search + Filter unified row */}
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                                    <div className="flex w-full max-w-md items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar por nombre o correo…"
                                                className="h-9 pl-9 pr-8 text-sm"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                            {search && (
                                                <button
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                    onClick={() => setSearch('')}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-9 gap-1.5 focus-visible:ring-0">
                                                    <ListFilter className="h-4 w-4" />
                                                    <span>Filtros</span>
                                                    {(profileFilter !== '__all__' || statusFilter !== '__all__') && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="ml-0.5 h-4.5 rounded-full px-1.5 text-[10px] font-medium"
                                                        >
                                                            {(profileFilter !== '__all__' ? 1 : 0) + (statusFilter !== '__all__' ? 1 : 0)}
                                                        </Badge>
                                                    )}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56">
                                                <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                    Perfil
                                                </DropdownMenuLabel>
                                                <DropdownMenuRadioGroup value={profileFilter} onValueChange={setProfileFilter}>
                                                    <DropdownMenuRadioItem value="__all__" className="text-sm">
                                                        Todos los perfiles
                                                    </DropdownMenuRadioItem>
                                                    {profiles.map((p) => (
                                                        <DropdownMenuRadioItem key={p.id} value={String(p.id)} className="text-sm">
                                                            {p.name}
                                                        </DropdownMenuRadioItem>
                                                    ))}
                                                </DropdownMenuRadioGroup>

                                                <DropdownMenuSeparator />

                                                <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                                    Estado
                                                </DropdownMenuLabel>
                                                <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                                                    <DropdownMenuRadioItem value="__all__" className="text-sm">
                                                        Cualquier estado
                                                    </DropdownMenuRadioItem>
                                                    <DropdownMenuRadioItem value="1" className="text-sm">
                                                        Verificados
                                                    </DropdownMenuRadioItem>
                                                    <DropdownMenuRadioItem value="0" className="text-sm">
                                                        Sin verificar
                                                    </DropdownMenuRadioItem>
                                                </DropdownMenuRadioGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Role sub-tabs integrated into the flow */}
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setRoleTab('admin')}
                                            className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                                                roleTab === 'admin'
                                                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                                    : 'border-transparent bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                        >
                                            Admin ({admins.length})
                                        </button>
                                        <button
                                            onClick={() => setRoleTab('user')}
                                            className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                                                roleTab === 'user'
                                                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                                    : 'border-transparent bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                        >
                                            Usuario ({regularUsers.length})
                                        </button>
                                    </div>
                                </div>

                                <UsersTable
                                    users={displayed}
                                    profiles={profiles}
                                    currentUserId={currentUserId}
                                />
                            </>
                        )}

                        {/* ── PERFILES TAB ─────────────────────────────── */}
                        {mainTab === 'profiles' && (
                            <>
                                <CardDescription className="mb-4">
                                    Define conjuntos de permisos reutilizables. Asígnalos a usuarios y añade
                                    excepciones individuales donde sea necesario.
                                </CardDescription>
                                <ProfileForm profiles={profiles} />
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Gestión de Usuarios', href: '/users' },
    ],
};
