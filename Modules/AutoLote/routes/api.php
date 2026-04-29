<?php

use Illuminate\Support\Facades\Route;
use Modules\AutoLote\Http\Controllers\LotController;
use Modules\AutoLote\Http\Controllers\PropertyTypeController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('lots', LotController::class);
    Route::apiResource('property-types', PropertyTypeController::class);
});
