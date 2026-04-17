import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { useMemo } from 'react';

interface RoomOption {
    id: number;
    room_number: string;
    floor: number;
    type_name: string;
    base_price: number;
    status?: string;
}

interface PartnerOption {
    id: number;
    name: string;
}

interface ReservationData {
    id: number;
    partner_id: number;
    room_id: number;
    check_in_date: string;
    check_out_date: string;
    notes: string | null;
}

interface Props {
    rooms: RoomOption[];
    partners: PartnerOption[];
    reservation?: ReservationData;
    selected_room_id: number | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Hospitality', href: '/hospitality/rooms' },
    { title: 'Reservations', href: '/hospitality/reservations' },
    { title: 'New', href: '/hospitality/reservations/create' },
];

export default function ReservationForm({ rooms, partners, reservation, selected_room_id }: Props) {
    const isEditing = !!reservation;

    const { data, setData, post, patch, errors, processing } = useForm({
        partner_id:     reservation?.partner_id     ?? '',
        room_id:        reservation?.room_id        ?? selected_room_id ?? '',
        check_in_date:  reservation?.check_in_date  ?? '',
        check_out_date: reservation?.check_out_date ?? '',
        notes:          reservation?.notes          ?? '',
    });

    const selectedRoom = useMemo(
        () => rooms.find((r) => r.id === Number(data.room_id)) ?? null,
        [data.room_id, rooms],
    );

    const nights = useMemo(() => {
        if (!data.check_in_date || !data.check_out_date) return 0;
        const diff = (new Date(data.check_out_date).getTime() - new Date(data.check_in_date).getTime()) / 86_400_000;
        return diff > 0 ? Math.floor(diff) : 0;
    }, [data.check_in_date, data.check_out_date]);

    const subtotal     = selectedRoom ? selectedRoom.base_price * nights : 0;
    const isv          = subtotal * 0.15;
    const tourismTax   = subtotal * 0.04;
    const total        = subtotal + isv + tourismTax;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (isEditing) {
            patch(`/hospitality/reservations/${reservation.id}`);
        } else {
            post('/hospitality/reservations');
        }
    }

    return (
        <div className="flex h-full flex-1 flex-col gap-4 p-4">
            <form onSubmit={submit} className="mx-auto w-full max-w-3xl space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                    {/* Guest */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Huésped *</label>
                        <select
                            value={data.partner_id}
                            onChange={(e) => setData('partner_id', e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                        >
                            <option value="">Seleccionar huésped...</option>
                            {partners.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        {errors.partner_id && <p className="text-xs text-red-500">{errors.partner_id}</p>}
                    </div>

                    {/* Room */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Habitación *</label>
                        <select
                            value={data.room_id}
                            onChange={(e) => setData('room_id', e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                        >
                            <option value="">Seleccionar habitación...</option>
                            {rooms.map((r) => (
                                <option key={r.id} value={r.id} disabled={r.status && r.status !== 'available' && r.id !== reservation?.room_id}>
                                    {r.room_number} — {r.type_name} · Piso {r.floor} · L.{r.base_price}/noche
                                    {r.status && r.status !== 'available' && r.id !== reservation?.room_id ? ' (no disponible)' : ''}
                                </option>
                            ))}
                        </select>
                        {errors.room_id && <p className="text-xs text-red-500">{errors.room_id}</p>}
                    </div>

                    {/* Check-in */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Fecha Entrada *</label>
                        <input
                            type="date"
                            value={data.check_in_date}
                            onChange={(e) => setData('check_in_date', e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                        {errors.check_in_date && <p className="text-xs text-red-500">{errors.check_in_date}</p>}
                    </div>

                    {/* Check-out */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Fecha Salida *</label>
                        <input
                            type="date"
                            value={data.check_out_date}
                            onChange={(e) => setData('check_out_date', e.target.value)}
                            min={data.check_in_date || undefined}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                        {errors.check_out_date && <p className="text-xs text-red-500">{errors.check_out_date}</p>}
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Notas</label>
                    <textarea
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                        placeholder="Solicitudes especiales, observaciones..."
                    />
                </div>

                {/* Cost summary */}
                {nights > 0 && selectedRoom && (
                    <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground mb-3">Resumen de Folio</p>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{nights} noche{nights > 1 ? 's' : ''} × L.{selectedRoom.base_price}</span>
                            <span className="text-foreground">L.{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground/80">ISV (15%)</span>
                            <span className="text-muted-foreground">L.{isv.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground/80">Impuesto S. Turismo (4%)</span>
                            <span className="text-muted-foreground">L.{tourismTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2 font-bold">
                            <span className="text-foreground">Total</span>
                            <span className="text-primary text-lg">L.{total.toFixed(2)}</span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link href={isEditing ? `/hospitality/reservations/${reservation.id}` : '/hospitality/reservations'}>
                        <Button type="button" variant="outline">
                            Cancelar
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        disabled={processing}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm shadow-primary/20"
                    >
                        {processing ? 'Guardando...' : isEditing ? 'Actualizar Reservación' : 'Crear Reservación'}
                    </Button>
                </div>
            </form>
        </div>
        </>
    );
}

ReservationForm.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
