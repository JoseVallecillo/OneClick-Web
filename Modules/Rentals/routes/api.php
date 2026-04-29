<?php

use Illuminate\Support\Facades\Route;
use Modules\Rentals\Http\Controllers\RentalOrderController;
use Modules\Rentals\Http\Controllers\RentalRateController;
use Modules\Rentals\Http\Controllers\RentalReportController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('rental-orders', RentalOrderController::class);
    Route::apiResource('rental-rates', RentalRateController::class);

    Route::get('rental-orders/lookup/availability', [RentalOrderController::class, 'lookupAvailability']);
    Route::get('reports/rentals', [RentalReportController::class, 'rentals']);
    Route::get('reports/revenue', [RentalReportController::class, 'revenue']);
});
