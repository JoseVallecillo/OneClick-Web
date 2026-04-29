<?php

namespace Modules\Hospitality\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Contacts\Models\Contact;
use Modules\Hospitality\Models\Reservation;
use Modules\Hospitality\Models\Room;
use Modules\Hospitality\Services\ReservationService;

class ReservationController extends Controller
{
    public function __construct(private readonly ReservationService $service) {}

    public function index(Request $request): Response
    {
        $query = Reservation::with(['partner', 'room.roomType', 'folio'])
            ->orderByDesc('id');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->whereHas('partner', fn ($q) => $q->where('name', 'ilike', "%{$search}%"));
        }

        return Inertia::render('Hospitality::Reservations/Index', [
            'reservations' => $query->paginate(20)->withQueryString()->through(fn (Reservation $r) => [
                'id'             => $r->id,
                'partner_name'   => $r->partner->name,
                'room_number'    => $r->room->room_number,
                'type_name'      => $r->room->roomType->name,
                'check_in_date'  => $r->check_in_date->format('Y-m-d'),
                'check_out_date' => $r->check_out_date->format('Y-m-d'),
                'nights'         => $r->nights(),
                'status'         => $r->status,
                'total_amount'   => $r->folio ? number_format($r->folio->total_amount, 2) : null,
                'payment_status' => $r->folio?->payment_status,
            ]),
            'filters' => $request->only('status', 'search'),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Hospitality::Reservations/Form', [
            'rooms'       => Room::with('roomType')->where('status', 'available')->get()->map(fn (Room $r) => [
                'id'          => $r->id,
                'room_number' => $r->room_number,
                'floor'       => $r->floor,
                'type_name'   => $r->roomType->name,
                'base_price'  => (float) $r->roomType->base_price,
            ]),
            'partners'    => Contact::orderBy('name')->get(['id', 'name']),
            'selected_room_id' => $request->integer('room_id') ?: null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'partner_id'     => ['required', 'integer', 'exists:contacts,id'],
            'room_id'        => ['required', 'integer', 'exists:hospitality_rooms,id'],
            'check_in_date'  => ['required', 'date', 'after_or_equal:today'],
            'check_out_date' => ['required', 'date', 'after:check_in_date'],
            'notes'          => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $reservation = $this->service->create($data);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['room_id' => $e->getMessage()])->withInput();
        }

        return redirect()->route('hospitality.reservations.show', $reservation)
            ->with('success', 'Reservation created successfully.');
    }

    public function show(Reservation $reservation): Response
    {
        $reservation->load(['partner', 'room.roomType', 'folio', 'creator']);

        return Inertia::render('Hospitality::Reservations/Show', [
            'reservation' => [
                'id'             => $reservation->id,
                'status'         => $reservation->status,
                'partner'        => ['id' => $reservation->partner->id, 'name' => $reservation->partner->name],
                'room'           => [
                    'id'          => $reservation->room->id,
                    'room_number' => $reservation->room->room_number,
                    'floor'       => $reservation->room->floor,
                    'type_name'   => $reservation->room->roomType->name,
                ],
                'check_in_date'  => $reservation->check_in_date->format('Y-m-d'),
                'check_out_date' => $reservation->check_out_date->format('Y-m-d'),
                'nights'         => $reservation->nights(),
                'notes'          => $reservation->notes,
                'created_by'     => $reservation->creator->name,
                'created_at'     => $reservation->created_at->format('Y-m-d H:i'),
                'folio'          => $reservation->folio ? [
                    'subtotal'           => number_format($reservation->folio->subtotal, 2),
                    'isv_amount'         => number_format($reservation->folio->isv_amount, 2),
                    'tourism_tax_amount' => number_format($reservation->folio->tourism_tax_amount, 2),
                    'total_amount'       => number_format($reservation->folio->total_amount, 2),
                    'payment_status'     => $reservation->folio->payment_status,
                ] : null,
            ],
        ]);
    }

    public function edit(Reservation $reservation): Response
    {
        abort_unless($reservation->isEditable(), 403, 'This reservation cannot be edited.');

        return Inertia::render('Hospitality::Reservations/Form', [
            'reservation' => [
                'id'             => $reservation->id,
                'partner_id'     => $reservation->partner_id,
                'room_id'        => $reservation->room_id,
                'check_in_date'  => $reservation->check_in_date->format('Y-m-d'),
                'check_out_date' => $reservation->check_out_date->format('Y-m-d'),
                'notes'          => $reservation->notes,
            ],
            'rooms'    => Room::with('roomType')->get()->map(fn (Room $r) => [
                'id'          => $r->id,
                'room_number' => $r->room_number,
                'floor'       => $r->floor,
                'type_name'   => $r->roomType->name,
                'base_price'  => (float) $r->roomType->base_price,
                'status'      => $r->status,
            ]),
            'partners' => Contact::orderBy('name')->get(['id', 'name']),
            'selected_room_id' => null,
        ]);
    }

    public function update(Request $request, Reservation $reservation): RedirectResponse
    {
        abort_unless($reservation->isEditable(), 403);

        $data = $request->validate([
            'partner_id'     => ['required', 'integer', 'exists:contacts,id'],
            'room_id'        => ['required', 'integer', 'exists:hospitality_rooms,id'],
            'check_in_date'  => ['required', 'date'],
            'check_out_date' => ['required', 'date', 'after:check_in_date'],
            'notes'          => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $this->service->update($reservation, $data);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['room_id' => $e->getMessage()])->withInput();
        }

        return redirect()->route('hospitality.reservations.show', $reservation)
            ->with('success', 'Reservation updated successfully.');
    }

    public function confirm(Reservation $reservation): RedirectResponse
    {
        try {
            $this->service->confirm($reservation);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['status' => $e->getMessage()]);
        }

        return back()->with('success', 'Reservation confirmed.');
    }

    public function checkIn(Reservation $reservation): RedirectResponse
    {
        try {
            $this->service->checkIn($reservation);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['status' => $e->getMessage()]);
        }

        return back()->with('success', 'Guest checked in successfully.');
    }

    public function checkOut(Reservation $reservation): RedirectResponse
    {
        try {
            $this->service->checkOut($reservation);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['status' => $e->getMessage()]);
        }

        return back()->with('success', 'Guest checked out. Room set to cleaning.');
    }

    public function cancel(Reservation $reservation): RedirectResponse
    {
        try {
            $this->service->cancel($reservation);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['status' => $e->getMessage()]);
        }

        return redirect()->route('hospitality.reservations.index')
            ->with('success', 'Reservation cancelled.');
    }
}
