<?php

namespace Modules\Hospitality\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Hospitality\Models\Room;

class RoomController extends Controller
{
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
