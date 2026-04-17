<?php

use Illuminate\Support\Facades\Route;
use Modules\Sales\Http\Controllers\SalesOrderController;

Route::middleware(['auth', 'verified'])->group(function () {

    // ── Entrada principal ─────────────────────────────────────────────────────
    Route::get('sales', fn () => redirect()->route('sales.index'))
        ->name('sales');

    // ── CRUD de Órdenes de Venta ──────────────────────────────────────────────
    Route::get('sales/orders',                [SalesOrderController::class, 'index'])->name('sales.index');
    Route::get('sales/orders/create',         [SalesOrderController::class, 'create'])->name('sales.create');
    Route::post('sales/orders',               [SalesOrderController::class, 'store'])->name('sales.store');
    Route::get('sales/orders/{order}',        [SalesOrderController::class, 'show'])->name('sales.show');
    Route::get('sales/orders/{order}/edit',   [SalesOrderController::class, 'edit'])->name('sales.edit');
    Route::patch('sales/orders/{order}',      [SalesOrderController::class, 'update'])->name('sales.update');
    Route::delete('sales/orders/{order}',     [SalesOrderController::class, 'destroy'])->name('sales.destroy');

    // ── Transiciones de Workflow ──────────────────────────────────────────────

    // Cotización → Confirmada
    Route::post('sales/orders/{order}/confirm', [SalesOrderController::class, 'confirm'])->name('sales.confirm');

    // Confirmada → Despachada (muestra formulario de despacho)
    Route::get('sales/orders/{order}/ship',   [SalesOrderController::class, 'ship'])->name('sales.ship');
    Route::post('sales/orders/{order}/ship',  [SalesOrderController::class, 'storeShip'])->name('sales.ship.store');

    // Despachada → Facturada (muestra formulario de factura)
    Route::get('sales/orders/{order}/invoice',  [SalesOrderController::class, 'invoice'])->name('sales.invoice');
    Route::post('sales/orders/{order}/invoice', [SalesOrderController::class, 'storeInvoice'])->name('sales.invoice.store');
});
