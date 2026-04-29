<?php

use Illuminate\Support\Facades\Route;
use Modules\Barbershop\Http\Controllers\AppointmentController;
use Modules\Barbershop\Http\Controllers\BarberController;
use Modules\Barbershop\Http\Controllers\BarbershopClientController;
use Modules\Barbershop\Http\Controllers\BarbershopConfigController;
use Modules\Barbershop\Http\Controllers\BarbershopQueueController;
use Modules\Barbershop\Http\Controllers\BarbershopServiceController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('appointments', AppointmentController::class);
    Route::apiResource('barbers', BarberController::class);
    Route::apiResource('barbershop-clients', BarbershopClientController::class);
    Route::apiResource('barbershop-configs', BarbershopConfigController::class);
    Route::apiResource('barbershop-queue', BarbershopQueueController::class);
    Route::apiResource('barbershop-services', BarbershopServiceController::class);
});
