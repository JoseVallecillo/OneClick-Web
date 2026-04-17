import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { Head, router, usePage } from '@inertiajs/react';
import {
    BookUser,
    CreditCard,
    Package,
    PackageCheck,
    Settings,
    ShieldAlert,
    ShoppingCart,
    Store,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { useState, useTransition } from 'react';

interface Module {
    name: string;
    alias: string;
    description: string;
    isEnabled: boolean;
    isCore: boolean;
}

interface Props {
    modules: Module[];
}

const MODULE_ICON_MAP: Record<string, LucideIcon> = {
    contacts: BookUser,
    inventory: Package,
    users: Users,
    governance: ShieldAlert,
    settings: Settings,
    purchases: ShoppingCart,
    subscriptions: CreditCard,
    appstore: Store,
    app_store: Store,
};

function getModuleIcon(mod: Module): LucideIcon {
    const keys = [mod.alias, mod.name]
        .map((v) => v.toLowerCase().replace(/\s+/g, '_'));

    for (const key of keys) {
        if (MODULE_ICON_MAP[key]) return MODULE_ICON_MAP[key];
    }

    return mod.isEnabled ? PackageCheck : Package;
}

export default function AppStore({ modules }: Props) {
    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();
    const flash = props.flash;

    const [isPending, startTransition] = useTransition();
    const [processingModules, setProcessingModules] = useState<Set<string>>(new Set());
    const [uninstallTarget, setUninstallTarget] = useState<string | null>(null);
    const [withRollback, setWithRollback] = useState(false);
    const [isUninstalling, setIsUninstalling] = useState(false);

    function install(moduleName: string) {
        startTransition(() => {
            setProcessingModules((prev) => new Set(prev).add(moduleName));
        });

        router.post(
            `/app-store/${moduleName}/install`,
            {},
            {
                onFinish: () => {
                    startTransition(() => {
                        setProcessingModules((prev) => {
                            const next = new Set(prev);
                            next.delete(moduleName);
                            return next;
                        });
                    });
                },
            },
        );
    }

    function openUninstallDialog(moduleName: string) {
        setWithRollback(false);
        setUninstallTarget(moduleName);
    }

    function closeUninstallDialog() {
        if (isUninstalling) return;
        setUninstallTarget(null);
        setWithRollback(false);
    }

    function confirmUninstall() {
        if (!uninstallTarget) return;

        setIsUninstalling(true);

        router.post(
            `/app-store/${uninstallTarget}/uninstall`,
            { rollback: withRollback },
            {
                onFinish: () => {
                    setIsUninstalling(false);
                    setUninstallTarget(null);
                    setWithRollback(false);
                },
            },
        );
    }

    return (
        <>
            <Head title="Tienda de Aplicaciones" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
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

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {modules.map((mod) => {
                        const isProcessing = processingModules.has(mod.name) || isPending;
                        const ModuleIcon = getModuleIcon(mod);

                        return (
                            <Card key={mod.alias} className="flex flex-col">
                                <CardHeader className="flex-row items-start gap-3 space-y-0">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <ModuleIcon className={`h-5 w-5 ${mod.isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <CardTitle className="text-base">{mod.name}</CardTitle>
                                        <Badge variant={mod.isEnabled ? 'default' : 'secondary'} className="text-xs">
                                            {mod.isEnabled ? 'Instalado' : 'No instalado'}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1">
                                    <CardDescription>{mod.description || 'No hay descripción disponible.'}</CardDescription>
                                </CardContent>

                                <CardFooter>
                                    {mod.isCore ? (
                                        <Button variant="outline" size="sm" disabled className="w-full">
                                            Módulo principal
                                        </Button>
                                    ) : mod.isEnabled ? (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="w-full"
                                            disabled={isProcessing}
                                            onClick={() => openUninstallDialog(mod.name)}
                                        >
                                            Desinstalar
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            className="w-full"
                                            disabled={processingModules.has(mod.name)}
                                            onClick={() => install(mod.name)}
                                        >
                                            {processingModules.has(mod.name) ? (
                                                <>
                                                    <Spinner className="mr-1" />
                                                    Instalando…
                                                </>
                                            ) : (
                                                'Instalar'
                                            )}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}

                    {modules.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
                            <Package className="mb-3 h-10 w-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No se encontraron módulos.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Uninstall confirmation dialog */}
            <Dialog open={uninstallTarget !== null} onOpenChange={(open) => !open && closeUninstallDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Desinstalar {uninstallTarget}</DialogTitle>
                        <DialogDescription>
                            Esto deshabilitará el módulo. ¿También quieres revertir sus migraciones de base de datos?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center gap-2 py-2">
                        <Checkbox
                            id="rollback"
                            checked={withRollback}
                            onCheckedChange={(checked) => setWithRollback(checked === true)}
                            disabled={isUninstalling}
                        />
                        <label htmlFor="rollback" className="cursor-pointer text-sm">
                            Revertir migraciones (esto eliminará las tablas del módulo)
                        </label>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeUninstallDialog} disabled={isUninstalling}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmUninstall} disabled={isUninstalling}>
                            {isUninstalling ? (
                                <>
                                    <Spinner className="mr-1" />
                                    Desinstalando…
                                </>
                            ) : (
                                'Confirmar Desinstalación'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

AppStore.layout = {
    breadcrumbs: [
        {
            title: 'Panel de Control',
            href: dashboard(),
        },
        {
            title: 'Tienda de Aplicaciones',
            href: '/app-store',
        },
    ],
};
