<?php

use Illuminate\Support\Facades\Route;
use Modules\Inventory\Http\Controllers\InventoryConfigController;
use Modules\Inventory\Http\Controllers\ProductController;
use Modules\Inventory\Http\Controllers\StockLotController;
use Modules\Inventory\Http\Controllers\StockMoveController;
use Modules\Inventory\Http\Controllers\InventoryAdjustmentController;
use Modules\Inventory\Http\Controllers\InventoryTransferController;
use Modules\Inventory\Http\Controllers\InventoryReturnController;
use Modules\Inventory\Http\Controllers\PhysicalCountController;
use Modules\Inventory\Http\Controllers\InventoryReportController;

Route::middleware(['auth', 'verified'])->group(function () {

    // ── Entrada principal de Inventario (Ahora a Movimientos) ─────────────────
    Route::get('inventory', fn () => redirect()->route('inventory.movements.index'))
        ->name('inventory.index');

    // ── Configuración (categorías, UoM, almacenes) ────────────────────────────
    Route::get('inventory/config', [InventoryConfigController::class, 'index'])->name('inventory.config');

    Route::post('inventory/config/categories',           [InventoryConfigController::class, 'storeCategory'])->name('inventory.categories.store');
    Route::patch('inventory/config/categories/{category}', [InventoryConfigController::class, 'updateCategory'])->name('inventory.categories.update');
    Route::delete('inventory/config/categories/{category}', [InventoryConfigController::class, 'destroyCategory'])->name('inventory.categories.destroy');

    Route::post('inventory/config/uoms',           [InventoryConfigController::class, 'storeUom'])->name('inventory.uoms.store');
    Route::patch('inventory/config/uoms/{uom}',    [InventoryConfigController::class, 'updateUom'])->name('inventory.uoms.update');
    Route::delete('inventory/config/uoms/{uom}',   [InventoryConfigController::class, 'destroyUom'])->name('inventory.uoms.destroy');

    Route::post('inventory/config/warehouses',              [InventoryConfigController::class, 'storeWarehouse'])->name('inventory.warehouses.store');
    Route::patch('inventory/config/warehouses/{warehouse}', [InventoryConfigController::class, 'updateWarehouse'])->name('inventory.warehouses.update');
    Route::delete('inventory/config/warehouses/{warehouse}',[InventoryConfigController::class, 'destroyWarehouse'])->name('inventory.warehouses.destroy');

    // Productos
    Route::get('inventory/products/lookup',         [ProductController::class, 'lookup'])->name('inventory.products.lookup');
    Route::get('inventory/products',                [ProductController::class, 'index'])->name('inventory.products.index');
    Route::get('inventory/products/create',         [ProductController::class, 'create'])->name('inventory.products.create');
    Route::post('inventory/products',               [ProductController::class, 'store'])->name('inventory.products.store');
    Route::get('inventory/products/{product}/edit', [ProductController::class, 'edit'])->name('inventory.products.edit');
    Route::patch('inventory/products/{product}',    [ProductController::class, 'update'])->name('inventory.products.update');
    Route::delete('inventory/products/{product}',   [ProductController::class, 'destroy'])->name('inventory.products.destroy');

    // ── Movimientos de stock ──────────────────────────────────────────────────
    Route::get('inventory/movements',               [StockMoveController::class, 'index'])->name('inventory.movements.index');
    Route::get('inventory/movements/create',        [StockMoveController::class, 'create'])->name('inventory.movements.create');
    Route::post('inventory/movements',              [StockMoveController::class, 'store'])->name('inventory.movements.store');
    Route::get('inventory/movements/{move}',        [StockMoveController::class, 'show'])->name('inventory.movements.show');
    Route::post('inventory/movements/{move}/confirm', [StockMoveController::class, 'confirm'])->name('inventory.movements.confirm');

    // ── Lotes y números de serie ──────────────────────────────────────────────
    Route::get('inventory/lots', [StockLotController::class, 'index'])->name('inventory.lots.index');

    // ── Ajustes de Inventario ──────────────────────────────────────────────────
    Route::get('inventory/adjustments',                 [InventoryAdjustmentController::class, 'index'])->name('inventory.adjustments.index');
    Route::get('inventory/adjustments/create',          [InventoryAdjustmentController::class, 'create'])->name('inventory.adjustments.create');
    Route::post('inventory/adjustments',                [InventoryAdjustmentController::class, 'store'])->name('inventory.adjustments.store');
    Route::post('inventory/adjustments/{adjustment}/approve', [InventoryAdjustmentController::class, 'approve'])->name('inventory.adjustments.approve');

    // ── Transferencias de Inventario ───────────────────────────────────────────
    Route::get('inventory/transfers',                   [InventoryTransferController::class, 'index'])->name('inventory.transfers.index');
    Route::get('inventory/transfers/create',            [InventoryTransferController::class, 'create'])->name('inventory.transfers.create');
    Route::post('inventory/transfers',                  [InventoryTransferController::class, 'store'])->name('inventory.transfers.store');
    Route::post('inventory/transfers/{transfer}/ship',  [InventoryTransferController::class, 'ship'])->name('inventory.transfers.ship');
    Route::post('inventory/transfers/{transfer}/receive', [InventoryTransferController::class, 'receive'])->name('inventory.transfers.receive');

    // ── Devoluciones de Clientes ───────────────────────────────────────────────
    Route::get('inventory/returns',                     [InventoryReturnController::class, 'index'])->name('inventory.returns.index');
    Route::get('inventory/returns/create',              [InventoryReturnController::class, 'create'])->name('inventory.returns.create');
    Route::post('inventory/returns',                    [InventoryReturnController::class, 'store'])->name('inventory.returns.store');
    Route::post('inventory/returns/{return}/approve',   [InventoryReturnController::class, 'approve'])->name('inventory.returns.approve');

    // ── Conteos Físicos ────────────────────────────────────────────────────────
    Route::get('inventory/physical-counts',                    [PhysicalCountController::class, 'index'])->name('inventory.physical-counts.index');
    Route::get('inventory/physical-counts/create',             [PhysicalCountController::class, 'create'])->name('inventory.physical-counts.create');
    Route::post('inventory/physical-counts',                   [PhysicalCountController::class, 'store'])->name('inventory.physical-counts.store');
    Route::get('inventory/physical-counts/{count}',            [PhysicalCountController::class, 'show'])->name('inventory.physical-counts.show');
    Route::patch('inventory/physical-counts/{count}/line',     [PhysicalCountController::class, 'updateLine'])->name('inventory.physical-counts.update-line');
    Route::post('inventory/physical-counts/{count}/complete',  [PhysicalCountController::class, 'complete'])->name('inventory.physical-counts.complete');
    Route::post('inventory/physical-counts/{count}/reconcile',  [PhysicalCountController::class, 'reconcile'])->name('inventory.physical-counts.reconcile');

    // ── Reportes de Inventario ─────────────────────────────────────────────────
    Route::get('inventory/reports/valuation',          [InventoryReportController::class, 'valuation'])->name('inventory.reports.valuation');
    Route::get('inventory/reports/abc-analysis',       [InventoryReportController::class, 'abcAnalysis'])->name('inventory.reports.abc-analysis');
    Route::get('inventory/reports/stock-rotation',     [InventoryReportController::class, 'stockRotation'])->name('inventory.reports.stock-rotation');
    Route::get('inventory/reports/low-stock',          [InventoryReportController::class, 'lowStock'])->name('inventory.reports.low-stock');
    Route::get('inventory/reports/reorder-suggestions', [InventoryReportController::class, 'reorderSuggestions'])->name('inventory.reports.reorder-suggestions');
    Route::get('inventory/reports/slow-moving',        [InventoryReportController::class, 'slowMoving'])->name('inventory.reports.slow-moving');
    Route::get('inventory/reports/obsolete',           [InventoryReportController::class, 'obsolete'])->name('inventory.reports.obsolete');
});
