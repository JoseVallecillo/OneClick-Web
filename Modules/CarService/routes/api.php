<?php

use Illuminate\Support\Facades\Route;
use Modules\CarService\Http\Controllers\ServiceOrderController;
use Modules\CarService\Http\Controllers\VehicleController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('service-orders', ServiceOrderController::class);
    Route::apiResource('vehicles', VehicleController::class);

    Route::get('vehicles/lookup', [VehicleController::class, 'lookup']);
    Route::get('customers/lookup', [ServiceOrderController::class, 'customersLookup']);
    Route::get('products/lookup', [ServiceOrderController::class, 'productsLookup']);
});
