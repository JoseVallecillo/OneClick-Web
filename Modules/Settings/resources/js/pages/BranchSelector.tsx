import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, router } from '@inertiajs/react';
import { Building2, MapPin } from 'lucide-react';
import { useState } from 'react';

interface BranchOption {
    id: number;
    name: string;
    address: string | null;
    email: string | null;
    company: { id: number; commercial_name: string } | null;
}

interface Props {
    branches: BranchOption[];
}

export default function BranchSelector({ branches }: Props) {
    const [selecting, setSelecting] = useState<number | null>(null);

    function select(branchId: number) {
        setSelecting(branchId);
        router.post('/select-branch', { branch_id: branchId }, {
            onFinish: () => setSelecting(null),
        });
    }

    return (
        <>
            <Head title="Seleccionar Sucursal" />

            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <div className="w-full max-w-lg">
                    <div className="mb-8 text-center">
                        <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                        <h1 className="text-2xl font-semibold tracking-tight">Selecciona una sucursal</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Tienes acceso a varias sucursales. Elige con cuál deseas trabajar.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {branches.map((branch) => (
                            <Card
                                key={branch.id}
                                className="cursor-pointer transition-colors hover:bg-muted/50"
                                onClick={() => select(branch.id)}
                            >
                                <CardHeader className="pb-1">
                                    <CardTitle className="text-base">{branch.name}</CardTitle>
                                    {branch.company && (
                                        <CardDescription>{branch.company.commercial_name}</CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="flex items-center justify-between pt-0">
                                    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                                        {branch.address && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {branch.address}
                                            </span>
                                        )}
                                        {branch.email && <span>{branch.email}</span>}
                                    </div>
                                    <Button
                                        size="sm"
                                        disabled={selecting === branch.id}
                                        onClick={(e) => { e.stopPropagation(); select(branch.id); }}
                                    >
                                        {selecting === branch.id ? 'Entrando…' : 'Seleccionar'}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
