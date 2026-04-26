<?php

use Illuminate\Support\Facades\Route;
use Modules\Barbershop\Http\Controllers\AppointmentController;
use Modules\Barbershop\Http\Controllers\BarberController;
use Modules\Contacts\Models\Contact;
use Modules\Barbershop\Http\Controllers\BarbershopClientController;
use Modules\Barbershop\Http\Controllers\BarbershopConfigController;
use Modules\Barbershop\Http\Controllers\BarbershopDashboardController;
use Modules\Barbershop\Http\Controllers\BarbershopQueueController;
use Modules\Barbershop\Http\Controllers\BarbershopServiceController;

Route::middleware(['auth', 'verified'])->group(function () {

    // ── Dashboard ─────────────────────────────────────────────────────────────
    Route::get('barbershop', [BarbershopDashboardController::class, 'index'])->name('barbershop.dashboard');

    // ── Citas ─────────────────────────────────────────────────────────────────
    Route::get('barbershop/appointments',                    [AppointmentController::class, 'index'])->name('barbershop.appointments.index');
    Route::get('barbershop/appointments/create',             [AppointmentController::class, 'create'])->name('barbershop.appointments.create');
    Route::post('barbershop/appointments',                   [AppointmentController::class, 'store'])->name('barbershop.appointments.store');
    Route::get('barbershop/appointments/{appointment}',      [AppointmentController::class, 'show'])->name('barbershop.appointments.show');
    Route::get('barbershop/appointments/{appointment}/edit', [AppointmentController::class, 'edit'])->name('barbershop.appointments.edit');
    Route::patch('barbershop/appointments/{appointment}',    [AppointmentController::class, 'update'])->name('barbershop.appointments.update');
    Route::delete('barbershop/appointments/{appointment}',   [AppointmentController::class, 'destroy'])->name('barbershop.appointments.destroy');
    Route::post('barbershop/appointments/{appointment}/status', [AppointmentController::class, 'updateStatus'])->name('barbershop.appointments.status');

    // ── Clientes ──────────────────────────────────────────────────────────────
    Route::get('barbershop/clients',                [BarbershopClientController::class, 'index'])->name('barbershop.clients.index');
    Route::get('barbershop/clients/create',         [BarbershopClientController::class, 'create'])->name('barbershop.clients.create');
    Route::post('barbershop/clients',               [BarbershopClientController::class, 'store'])->name('barbershop.clients.store');
    Route::get('barbershop/clients/{client}',       [BarbershopClientController::class, 'show'])->name('barbershop.clients.show');
    Route::get('barbershop/clients/{client}/edit',  [BarbershopClientController::class, 'edit'])->name('barbershop.clients.edit');
    Route::patch('barbershop/clients/{client}',     [BarbershopClientController::class, 'update'])->name('barbershop.clients.update');
    Route::delete('barbershop/clients/{client}',    [BarbershopClientController::class, 'destroy'])->name('barbershop.clients.destroy');

    // ── Barberos ──────────────────────────────────────────────────────────────
    Route::get('barbershop/barbers',                [BarberController::class, 'index'])->name('barbershop.barbers.index');
    Route::get('barbershop/barbers/create',         [BarberController::class, 'create'])->name('barbershop.barbers.create');
    Route::post('barbershop/barbers',               [BarberController::class, 'store'])->name('barbershop.barbers.store');
    Route::get('barbershop/barbers/{barber}',       [BarberController::class, 'show'])->name('barbershop.barbers.show');
    Route::get('barbershop/barbers/{barber}/edit',  [BarberController::class, 'edit'])->name('barbershop.barbers.edit');
    Route::patch('barbershop/barbers/{barber}',     [BarberController::class, 'update'])->name('barbershop.barbers.update');
    Route::delete('barbershop/barbers/{barber}',    [BarberController::class, 'destroy'])->name('barbershop.barbers.destroy');
    Route::post('barbershop/barbers/{barber}/time-blocks',            [BarberController::class, 'storeTimeBlock'])->name('barbershop.barbers.time-blocks.store');
    Route::delete('barbershop/barbers/{barber}/time-blocks/{block}',  [BarberController::class, 'destroyTimeBlock'])->name('barbershop.barbers.time-blocks.destroy');

    // ── Servicios ─────────────────────────────────────────────────────────────
    Route::get('barbershop/services',                [BarbershopServiceController::class, 'index'])->name('barbershop.services.index');
    Route::get('barbershop/services/create',         [BarbershopServiceController::class, 'create'])->name('barbershop.services.create');
    Route::post('barbershop/services',               [BarbershopServiceController::class, 'store'])->name('barbershop.services.store');
    Route::get('barbershop/services/{service}/edit', [BarbershopServiceController::class, 'edit'])->name('barbershop.services.edit');
    Route::patch('barbershop/services/{service}',    [BarbershopServiceController::class, 'update'])->name('barbershop.services.update');
    Route::delete('barbershop/services/{service}',   [BarbershopServiceController::class, 'destroy'])->name('barbershop.services.destroy');

    // ── Cola de espera ────────────────────────────────────────────────────────
    Route::get('barbershop/queue',               [BarbershopQueueController::class, 'index'])->name('barbershop.queue.index');
    Route::post('barbershop/queue',              [BarbershopQueueController::class, 'store'])->name('barbershop.queue.store');
    Route::post('barbershop/queue/{entry}/status', [BarbershopQueueController::class, 'updateStatus'])->name('barbershop.queue.status');
    Route::delete('barbershop/queue/{entry}',    [BarbershopQueueController::class, 'destroy'])->name('barbershop.queue.destroy');
    Route::post('barbershop/queue/reorder',      [BarbershopQueueController::class, 'reorder'])->name('barbershop.queue.reorder');

    // ── Configuración ─────────────────────────────────────────────────────────
    Route::get('barbershop/config',                              [BarbershopConfigController::class, 'index'])->name('barbershop.config');
    Route::post('barbershop/config/categories',                  [BarbershopConfigController::class, 'storeCategory'])->name('barbershop.categories.store');
    Route::patch('barbershop/config/categories/{category}',      [BarbershopConfigController::class, 'updateCategory'])->name('barbershop.categories.update');
    Route::delete('barbershop/config/categories/{category}',     [BarbershopConfigController::class, 'destroyCategory'])->name('barbershop.categories.destroy');
});
