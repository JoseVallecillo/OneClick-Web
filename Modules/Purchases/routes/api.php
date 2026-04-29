<?php

use Illuminate\Support\Facades\Route;
use Modules\Purchases\Http\Controllers\PurchaseOrderController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('purchase-orders', PurchaseOrderController::class);
});
