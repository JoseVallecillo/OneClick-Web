import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface PermissionError {
    title: string;
    message: string;
    permission: string;
}

export function PermissionDeniedDialog() {
    const { props } = usePage<{ permission_error?: PermissionError }>();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (props.permission_error) {
            setOpen(true);
        }
    }, [props.permission_error]);

    if (!props.permission_error) {
        return null;
    }

    const { title, message, permission } = props.permission_error;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2">{message}</DialogDescription>
                </DialogHeader>

                <div className="bg-muted rounded-lg p-3 text-sm font-mono text-muted-foreground">
                    {permission}
                </div>

                <p className="text-xs text-muted-foreground">
                    Si crees que deberías tener este permiso, contacta a un administrador.
                </p>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Entendido
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
