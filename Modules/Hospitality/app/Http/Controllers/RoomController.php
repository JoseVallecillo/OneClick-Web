<?php

namespace Modules\Hospitality\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Hospitality\Models\Room;
use Modules\Hospitality\Models\RoomType;

class RoomController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);

        $rooms = Room::with('roomType')->orderBy('floor')->orderBy('room_number')->get();

        return Inertia::render('Hospitality::Rooms/Index', [
            'rooms' => $rooms,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);

        return Inertia::render('Hospitality::Rooms/Form', [
            'roomTypes' => RoomType::orderBy('name')->get(['id', 'name', 'base_price']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'room_number'  => ['required', 'string', 'max:10', 'unique:hospitality_rooms,room_number'],
            'floor'        => ['required', 'integer', 'min:0'],
            'room_type_id' => ['required', 'exists:hospitality_room_types,id'],
            'status'       => ['required', 'in:available,occupied,cleaning,maintenance'],
        ]);

        Room::create($data);

        return redirect()->route('hospitality.rooms.index')
            ->with('success', "Habitación {$data['room_number']} creada.");
    }

    public function edit(Request $request, Room $room): Response
    {
        $this->requireAdmin($request);

        return Inertia::render('Hospitality::Rooms/Form', [
            'room'      => $room,
            'roomTypes' => RoomType::orderBy('name')->get(['id', 'name', 'base_price']),
        ]);
    }

    public function update(Request $request, Room $room): RedirectResponse
    {
        $this->requireAdmin($request);

        $data = $request->validate([
            'room_number'  => ['required', 'string', 'max:10', "unique:hospitality_rooms,room_number,{$room->id}"],
            'floor'        => ['required', 'integer', 'min:0'],
            'room_type_id' => ['required', 'exists:hospitality_room_types,id'],
            'status'       => ['required', 'in:available,occupied,cleaning,maintenance'],
        ]);

        $room->update($data);

        return redirect()->route('hospitality.rooms.index')
            ->with('success', "Habitación {$room->room_number} actualizada.");
    }

    public function destroy(Request $request, Room $room): RedirectResponse
    {
        $this->requireAdmin($request);

        if ($room->reservations()->whereIn('status', ['confirmed', 'checked_in'])->exists()) {
            return back()->withErrors(['room' => 'No puedes eliminar una habitación con reservaciones activas.']);
        }

        $room->delete();

        return redirect()->route('hospitality.rooms.index')
            ->with('success', "Habitación {$room->room_number} eliminada.");
    }

    public function markAvailable(Room $room): RedirectResponse
    {
        $room->update(['status' => 'available']);

        return back()->with('success', "Habitación {$room->room_number} marcada como disponible.");
    }

    public function board(): Response
    {
        $rooms = Room::with(['roomType', 'activeReservation.partner'])->get();

        $stats = [
            'available'   => $rooms->where('status', 'available')->count(),
            'occupied'    => $rooms->where('status', 'occupied')->count(),
            'cleaning'    => $rooms->where('status', 'cleaning')->count(),
            'maintenance' => $rooms->where('status', 'maintenance')->count(),
        ];

        return Inertia::render('Hospitality::RoomBoard', [
            'stats' => $stats,
            'rooms' => $rooms->map(fn (Room $room) => [
                'id'             => $room->id,
                'room_number'    => $room->room_number,
                'floor'          => $room->floor,
                'status'         => $room->status,
                'type_name'      => $room->roomType->name,
                'base_price'     => number_format($room->roomType->base_price, 2),
                'guest_name'     => $room->activeReservation?->partner?->name,
                'reservation_id' => $room->activeReservation?->id,
            ])->values(),
        ]);
    }
}
