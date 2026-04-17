<?php

use Illuminate\Support\Facades\Route;
use Modules\Purchases\Http\Controllers\PurchaseOrderController;

Route::middleware(['auth', 'verified'])->group(function () {

    // ── Entrada principal ─────────────────────────────────────────────────────
    Route::get('purchases', fn () => redirect()->route('purchases.index'))
        ->name('purchases');

    // ── CRUD de Órdenes de Compra ─────────────────────────────────────────────
    Route::get('purchases/orders',                  [PurchaseOrderController::class, 'index'])->name('purchases.index');
    Route::get('purchases/orders/create',           [PurchaseOrderController::class, 'create'])->name('purchases.create');
    Route::post('purchases/orders',                 [PurchaseOrderController::class, 'store'])->name('purchases.store');
    Route::get('purchases/orders/{order}',          [PurchaseOrderController::class, 'show'])->name('purchases.show');
    Route::get('purchases/orders/{order}/edit',     [PurchaseOrderController::class, 'edit'])->name('purchases.edit');
    Route::patch('purchases/orders/{order}',        [PurchaseOrderController::class, 'update'])->name('purchases.update');
    Route::delete('purchases/orders/{order}',       [PurchaseOrderController::class, 'destroy'])->name('purchases.destroy');

    // ── Transiciones de Workflow ──────────────────────────────────────────────

    // Borrador → Confirmado
    Route::post('purchases/orders/{order}/confirm', [PurchaseOrderController::class, 'confirm'])->name('purchases.confirm');

    // Confirmado → Recibido (muestra formulario de recepción)
    Route::get('purchases/orders/{order}/receive',  [PurchaseOrderController::class, 'receive'])->name('purchases.receive');
    Route::post('purchases/orders/{order}/receive', [PurchaseOrderController::class, 'storeReceive'])->name('purchases.receive.store');

    // Recibido → Facturado (muestra formulario de factura)
    Route::get('purchases/orders/{order}/invoice',  [PurchaseOrderController::class, 'invoice'])->name('purchases.invoice');
    Route::post('purchases/orders/{order}/invoice', [PurchaseOrderController::class, 'storeInvoice'])->name('purchases.invoice.store');
});
