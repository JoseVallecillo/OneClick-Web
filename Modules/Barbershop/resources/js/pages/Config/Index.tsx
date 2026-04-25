import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Save, Tag, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface CategoryRow { id: number; name: string; color: string; active: boolean; }
interface Props { categories: CategoryRow[]; }

export default function BarbershopConfig({ categories }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [newName, setNewName]   = useState('');
    const [newColor, setNewColor] = useState('#6366f1');
    const [adding, setAdding]     = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName]   = useState('');
    const [editColor, setEditColor] = useState('');
    const [editActive, setEditActive] = useState(true);
    const [saving, setSaving]       = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    function addCategory() {
        if (!newName.trim()) return;
        setAdding(true);
        router.post('/barbershop/config/categories', { name: newName, color: newColor }, {
            onFinish: () => { setAdding(false); setNewName(''); setNewColor('#6366f1'); },
        });
    }

    function startEdit(cat: CategoryRow) {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditColor(cat.color);
        setEditActive(cat.active);
    }

    function saveEdit(id: number) {
        setSaving(true);
        router.patch(`/barbershop/config/categories/${id}`, { name: editName, color: editColor, active: editActive }, {
            onFinish: () => { setSaving(false); setEditingId(null); },
        });
    }

    function deleteCategory(id: number) {
        if (!confirm('¿Eliminar esta categoría? Los servicios asignados quedarán sin categoría.')) return;
        setDeletingId(id);
        router.delete(`/barbershop/config/categories/${id}`, { onFinish: () => setDeletingId(null) });
    }

    return (
        <>
            <Head title="Configuración — Barbería" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div>
                    <h1 className="text-xl font-bold">Configuración de Barbería</h1>
                    <p className="text-sm text-muted-foreground">Administra las categorías de servicios.</p>
                </div>

                {flash?.success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">{flash.success}</div>}
                {flash?.error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">{flash.error}</div>}

                {/* Categories */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Categorías de Servicios
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Add form */}
                        <div className="flex flex-wrap items-end gap-3 rounded-lg border p-3 bg-muted/20">
                            <div className="flex flex-col gap-1">
                                <Label className="text-xs">Nombre</Label>
                                <Input
                                    placeholder="Ej: Cortes, Barba, Color"
                                    className="h-8 text-sm w-48"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addCategory()}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label className="text-xs">Color</Label>
                                <div className="flex gap-2 items-center">
                                    <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-8 w-10 rounded-md border cursor-pointer p-0.5" />
                                    <span className="text-xs text-muted-foreground">{newColor}</span>
                                </div>
                            </div>
                            <Button size="sm" className="h-8 gap-1.5 text-xs" disabled={!newName.trim() || adding} onClick={addCategory}>
                                {adding ? <Spinner className="h-3 w-3" /> : <Plus className="h-3.5 w-3.5" />}
                                Agregar
                            </Button>
                        </div>

                        {/* List */}
                        {categories.length === 0 ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">No hay categorías aún.</p>
                        ) : (
                            <div className="divide-y">
                                {categories.map(cat => (
                                    <div key={cat.id} className="py-3 flex items-center gap-3">
                                        {editingId === cat.id ? (
                                            <>
                                                <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="h-8 w-10 rounded-md border cursor-pointer p-0.5 flex-shrink-0" />
                                                <Input className="h-8 text-sm flex-1" value={editName} onChange={e => setEditName(e.target.value)} />
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" id={`active_${cat.id}`} checked={editActive} onChange={e => setEditActive(e.target.checked)} className="h-4 w-4 rounded" />
                                                    <Label htmlFor={`active_${cat.id}`} className="text-xs cursor-pointer">Activo</Label>
                                                </div>
                                                <Button size="sm" className="h-8 w-8 p-0" disabled={saving} onClick={() => saveEdit(cat.id)}>
                                                    {saving ? <Spinner className="h-3 w-3" /> : <Save className="h-3.5 w-3.5" />}
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingId(null)}>
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                                                <span className="flex-1 text-sm font-medium">{cat.name}</span>
                                                <Badge variant={cat.active ? 'secondary' : 'outline'} className="text-[10px]">{cat.active ? 'Activo' : 'Inactivo'}</Badge>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(cat)}>
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" disabled={deletingId === cat.id} onClick={() => deleteCategory(cat.id)}>
                                                    {deletingId === cat.id ? <Spinner className="h-3 w-3" /> : <Trash2 className="h-3.5 w-3.5" />}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

BarbershopConfig.layout = {
    breadcrumbs: [
        { title: 'Panel de Control', href: dashboard() },
        { title: 'Barbería', href: '/barbershop' },
        { title: 'Configuración', href: '/barbershop/config' },
    ],
};
