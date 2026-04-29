<?php

use Illuminate\Support\Facades\Route;
use Modules\Hospitality\Http\Controllers\ReservationController;
use Modules\Hospitality\Http\Controllers\RoomController;
use Modules\Hospitality\Http\Controllers\RoomTypeController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('reservations', ReservationController::class);
    Route::apiResource('rooms', RoomController::class);
    Route::apiResource('room-types', RoomTypeController::class);
});
