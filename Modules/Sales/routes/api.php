<?php

use Illuminate\Support\Facades\Route;
use Modules\Sales\Http\Controllers\SalesOrderController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('orders', SalesOrderController::class);
});
