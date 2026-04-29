<?php

use Illuminate\Support\Facades\Route;
use Modules\Inventory\Http\Controllers\ProductController;
use Modules\Inventory\Http\Controllers\InventoryAdjustmentController;
use Modules\Inventory\Http\Controllers\InventoryConfigController;
use Modules\Inventory\Http\Controllers\InventoryReturnController;
use Modules\Inventory\Http\Controllers\InventoryTransferController;
use Modules\Inventory\Http\Controllers\PhysicalCountController;
use Modules\Inventory\Http\Controllers\StockLotController;
use Modules\Inventory\Http\Controllers\StockMoveController;
use Modules\Inventory\Http\Controllers\InventoryReportController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('products', ProductController::class);
    Route::apiResource('inventory-adjustments', InventoryAdjustmentController::class);
    Route::apiResource('inventory-configs', InventoryConfigController::class);
    Route::apiResource('inventory-returns', InventoryReturnController::class);
    Route::apiResource('inventory-transfers', InventoryTransferController::class);
    Route::apiResource('physical-counts', PhysicalCountController::class);
    Route::apiResource('stock-lots', StockLotController::class);
    Route::apiResource('stock-moves', StockMoveController::class);

    Route::get('products/lookup', [ProductController::class, 'lookup']);
    Route::get('reports/stock', [InventoryReportController::class, 'stock']);
    Route::get('reports/movements', [InventoryReportController::class, 'movements']);
    Route::get('reports/valuation', [InventoryReportController::class, 'valuation']);
});
