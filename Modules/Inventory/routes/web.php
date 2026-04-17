<?php

use Illuminate\Support\Facades\Route;
use Modules\Inventory\Http\Controllers\InventoryConfigController;
use Modules\Inventory\Http\Controllers\ProductController;
use Modules\Inventory\Http\Controllers\StockLotController;
use Modules\Inventory\Http\Controllers\StockMoveController;

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
});
