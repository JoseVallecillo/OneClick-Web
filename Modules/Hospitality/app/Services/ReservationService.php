<?php

namespace Modules\Hospitality\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Modules\Hospitality\Models\Folio;
use Modules\Hospitality\Models\Reservation;
use Modules\Hospitality\Models\Room;

class ReservationService
{
    /**
     * Check if a room has no overlapping active reservations for the given date range.
     * Overlap condition: existing.check_in < new.check_out AND existing.check_out > new.check_in
     */
    public function isRoomAvailable(int $roomId, Carbon $checkIn, Carbon $checkOut, ?int $excludeId = null): bool
    {
        $query = Reservation::where('room_id', $roomId)
            ->whereNotIn('status', ['cancelled', 'checked_out'])
            ->where('check_in_date', '<', $checkOut)
            ->where('check_out_date', '>', $checkIn);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->doesntExist();
    }

    public function create(array $data): Reservation
    {
        $checkIn  = Carbon::parse($data['check_in_date']);
        $checkOut = Carbon::parse($data['check_out_date']);

        if ($checkOut->lte($checkIn)) {
            throw new \InvalidArgumentException('Check-out date must be after check-in date.');
        }

        if (!$this->isRoomAvailable($data['room_id'], $checkIn, $checkOut)) {
            throw new \RuntimeException('Room is not available for the selected dates (overbooking prevented).');
        }

        return DB::transaction(function () use ($data, $checkIn, $checkOut) {
            $reservation = Reservation::create(array_merge($data, [
                'created_by' => Auth::id(),
            ]));

            $this->buildFolio($reservation, $checkIn, $checkOut);

            return $reservation;
        });
    }

    public function update(Reservation $reservation, array $data): Reservation
    {
        $checkIn  = Carbon::parse($data['check_in_date']);
        $checkOut = Carbon::parse($data['check_out_date']);

        if ($checkOut->lte($checkIn)) {
            throw new \InvalidArgumentException('Check-out date must be after check-in date.');
        }

        $roomId = $data['room_id'] ?? $reservation->room_id;

        if (!$this->isRoomAvailable($roomId, $checkIn, $checkOut, $reservation->id)) {
            throw new \RuntimeException('Room is not available for the selected dates (overbooking prevented).');
        }

        return DB::transaction(function () use ($reservation, $data, $checkIn, $checkOut) {
            $reservation->update($data);
            $this->buildFolio($reservation->fresh(), $checkIn, $checkOut);

            return $reservation->fresh();
        });
    }

    public function confirm(Reservation $reservation): void
    {
        if (!$reservation->isDraft()) {
            throw new \RuntimeException('Only draft reservations can be confirmed.');
        }

        $reservation->update(['status' => 'confirmed']);
    }

    public function checkIn(Reservation $reservation): void
    {
        if (!$reservation->isConfirmed()) {
            throw new \RuntimeException('Only confirmed reservations can be checked in.');
        }

        DB::transaction(function () use ($reservation) {
            $reservation->update(['status' => 'checked_in']);
            $reservation->room->update(['status' => 'occupied']);
        });
    }

    public function checkOut(Reservation $reservation): void
    {
        if (!$reservation->isCheckedIn()) {
            throw new \RuntimeException('Only checked-in reservations can be checked out.');
        }

        DB::transaction(function () use ($reservation) {
            $reservation->update(['status' => 'checked_out']);
            $reservation->room->update(['status' => 'cleaning']);
        });
    }

    public function cancel(Reservation $reservation): void
    {
        if (!$reservation->isEditable()) {
            throw new \RuntimeException('Only draft or confirmed reservations can be cancelled.');
        }

        DB::transaction(function () use ($reservation) {
            $reservation->update(['status' => 'cancelled']);

            if ($reservation->room->status === 'occupied') {
                $reservation->room->update(['status' => 'available']);
            }
        });
    }

    private function buildFolio(Reservation $reservation, Carbon $checkIn, Carbon $checkOut): void
    {
        $room    = Room::with('roomType')->find($reservation->room_id);
        $nights  = max(1, $checkIn->diffInDays($checkOut));
        $subtotal = $room->roomType->base_price * $nights;

        $folio = $reservation->folio ?? new Folio(['reservation_id' => $reservation->id, 'payment_status' => 'pending']);
        $folio->calculateFromSubtotal((float) $subtotal);
        $folio->save();
    }
}
