<?php

use Illuminate\Support\Facades\Route;
use Modules\Pos\Http\Controllers\PosOrderController;
use Modules\Pos\Http\Controllers\PosSaleController;
use Modules\Pos\Http\Controllers\PosSessionController;
use Modules\Pos\Http\Controllers\PosTableController;
use Modules\Pos\Http\Controllers\PosWaiterController;
use Modules\Pos\Http\Controllers\PosPromotionController;
use Modules\Pos\Http\Controllers\KitchenTicketController;
use Modules\Pos\Http\Controllers\PosClosingController;
use Modules\Pos\Http\Controllers\PosReceiptController;
use Modules\Pos\Http\Controllers\FiscalIntegrationController;
use Modules\Pos\Http\Controllers\PosReportController;
use Modules\Pos\Http\Controllers\PosTransactionHistoryController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('orders', PosOrderController::class);
    Route::apiResource('sales', PosSaleController::class);
    Route::apiResource('sessions', PosSessionController::class);
    Route::apiResource('tables', PosTableController::class);
    Route::apiResource('waiters', PosWaiterController::class);
    Route::apiResource('promotions', PosPromotionController::class);
    Route::apiResource('kitchen-tickets', KitchenTicketController::class);
    Route::apiResource('closings', PosClosingController::class);
    Route::apiResource('receipts', PosReceiptController::class);
    Route::apiResource('fiscal-integrations', FiscalIntegrationController::class);
    Route::apiResource('transaction-history', PosTransactionHistoryController::class);

    Route::post('sessions/{session}/close', [PosSessionController::class, 'close']);
    Route::get('reports/sales', [PosReportController::class, 'sales']);
    Route::get('reports/revenue', [PosReportController::class, 'revenue']);
    Route::get('reports/inventory-movement', [PosReportController::class, 'inventoryMovement']);
});
