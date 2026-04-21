<?php

use Illuminate\Support\Facades\Route;
use Modules\Hospitality\Http\Controllers\ReservationController;
use Modules\Hospitality\Http\Controllers\RoomController;
use Modules\Hospitality\Http\Controllers\RoomTypeController;

Route::middleware(['auth', 'verified'])->prefix('hospitality')->name('hospitality.')->group(function () {

    Route::get('/', fn () => redirect()->route('hospitality.board'))->name('home');

    // Room Board
    Route::get('/rooms',                        [RoomController::class, 'board'])->name('board');

    // Room Types CRUD
    Route::get('/room-types',                   [RoomTypeController::class, 'index'])->name('room-types.index');
    Route::get('/room-types/create',            [RoomTypeController::class, 'create'])->name('room-types.create');
    Route::post('/room-types',                  [RoomTypeController::class, 'store'])->name('room-types.store');
    Route::get('/room-types/{roomType}/edit',   [RoomTypeController::class, 'edit'])->name('room-types.edit');
    Route::patch('/room-types/{roomType}',      [RoomTypeController::class, 'update'])->name('room-types.update');
    Route::delete('/room-types/{roomType}',     [RoomTypeController::class, 'destroy'])->name('room-types.destroy');

    // Rooms CRUD
    Route::get('/rooms/list',                   [RoomController::class, 'index'])->name('rooms.index');
    Route::get('/rooms/create',                 [RoomController::class, 'create'])->name('rooms.create');
    Route::post('/rooms',                       [RoomController::class, 'store'])->name('rooms.store');
    Route::get('/rooms/{room}/edit',            [RoomController::class, 'edit'])->name('rooms.edit');
    Route::patch('/rooms/{room}',               [RoomController::class, 'update'])->name('rooms.update');
    Route::delete('/rooms/{room}',              [RoomController::class, 'destroy'])->name('rooms.destroy');
    Route::patch('/rooms/{room}/available',     [RoomController::class, 'markAvailable'])->name('rooms.available');

    // Reservations CRUD
    Route::get('/reservations',                        [ReservationController::class, 'index'])->name('reservations.index');
    Route::get('/reservations/create',                 [ReservationController::class, 'create'])->name('reservations.create');
    Route::post('/reservations',                       [ReservationController::class, 'store'])->name('reservations.store');
    Route::get('/reservations/{reservation}',          [ReservationController::class, 'show'])->name('reservations.show');
    Route::get('/reservations/{reservation}/edit',     [ReservationController::class, 'edit'])->name('reservations.edit');
    Route::patch('/reservations/{reservation}',        [ReservationController::class, 'update'])->name('reservations.update');

    // Workflow transitions
    Route::post('/reservations/{reservation}/confirm',   [ReservationController::class, 'confirm'])->name('reservations.confirm');
    Route::post('/reservations/{reservation}/check-in',  [ReservationController::class, 'checkIn'])->name('reservations.check-in');
    Route::post('/reservations/{reservation}/check-out', [ReservationController::class, 'checkOut'])->name('reservations.check-out');
    Route::post('/reservations/{reservation}/cancel',    [ReservationController::class, 'cancel'])->name('reservations.cancel');
});
