<?php

use Illuminate\Support\Facades\Route;
use Modules\Hospitality\Http\Controllers\ReservationController;
use Modules\Hospitality\Http\Controllers\RoomController;

Route::middleware(['auth', 'verified'])->prefix('hospitality')->name('hospitality.')->group(function () {

    Route::get('/', fn () => redirect()->route('hospitality.board'))->name('home');

    // Room Board
    Route::get('/rooms', [RoomController::class, 'board'])->name('board');

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
