<?php

use Illuminate\Support\Facades\Route;
use Modules\Pos\Http\Controllers\PosOrderController;
use Modules\Pos\Http\Controllers\PosSessionController;
use Modules\Pos\Http\Controllers\PosSaleController;
use Modules\Pos\Http\Controllers\PosTableController;
use Modules\Pos\Http\Controllers\PosWaiterController;

Route::middleware(['auth', 'verified'])->group(function () {

    // ── Entrada principal ─────────────────────────────────────────────────────
    Route::get('pos', fn () => redirect()->route('pos.sessions.index'))
        ->name('pos');

    // ── Sesiones de caja ──────────────────────────────────────────────────────
    Route::get('pos/sessions',                 [PosSessionController::class, 'index'])->name('pos.sessions.index');
    Route::get('pos/sessions/open',            [PosSessionController::class, 'open'])->name('pos.sessions.open');
    Route::post('pos/sessions',                [PosSessionController::class, 'store'])->name('pos.sessions.store');
    Route::get('pos/sessions/{session}',       [PosSessionController::class, 'show'])->name('pos.sessions.show');
    Route::get('pos/sessions/{session}/close', [PosSessionController::class, 'close'])->name('pos.sessions.close');
    Route::post('pos/sessions/{session}/close',[PosSessionController::class, 'storeClose'])->name('pos.sessions.close.store');

    // ── Terminal POS (venta rápida) ───────────────────────────────────────────
    Route::get('pos/sessions/{session}/sell',  [PosSaleController::class, 'sell'])->name('pos.sell');
    Route::post('pos/sessions/{session}/sales',[PosSaleController::class, 'store'])->name('pos.sales.store');

    // ── Recibos y anulaciones ─────────────────────────────────────────────────
    Route::get('pos/sales/{sale}/receipt',     [PosSaleController::class, 'receipt'])->name('pos.sales.receipt');
    Route::post('pos/sales/{sale}/void',       [PosSaleController::class, 'void'])->name('pos.sales.void');

    // ── Mesas — CRUD (create antes de {table} para evitar conflicto de ruta) ──
    Route::get('pos/tables/create',         [PosTableController::class, 'create'])->name('pos.tables.create');
    Route::post('pos/tables',               [PosTableController::class, 'store'])->name('pos.tables.store');
    Route::get('pos/tables',                [PosTableController::class, 'index'])->name('pos.tables.index');
    Route::get('pos/tables/{table}/edit',   [PosTableController::class, 'edit'])->name('pos.tables.edit');
    Route::put('pos/tables/{table}',        [PosTableController::class, 'update'])->name('pos.tables.update');
    Route::delete('pos/tables/{table}',     [PosTableController::class, 'destroy'])->name('pos.tables.destroy');

    // ── Mesas — acciones de servicio ──────────────────────────────────────────
    Route::post('pos/tables/{table}/open',   [PosTableController::class, 'openTable'])->name('pos.tables.open');
    Route::patch('pos/tables/{table}/status',[PosTableController::class, 'updateStatus'])->name('pos.tables.updateStatus');
    Route::post('pos/tables/{table}/close',  [PosTableController::class, 'closeTable'])->name('pos.tables.close');

    // ── Órdenes de mesa (comandas) ────────────────────────────────────────────
    Route::get('pos/orders/{order}',                    [PosOrderController::class, 'show'])->name('pos.orders.show');
    Route::post('pos/orders/{order}/lines',             [PosOrderController::class, 'addLine'])->name('pos.orders.addLine');
    Route::patch('pos/orders/{order}/lines/{line}',     [PosOrderController::class, 'updateLine'])->name('pos.orders.updateLine');
    Route::delete('pos/orders/{order}/lines/{line}',    [PosOrderController::class, 'removeLine'])->name('pos.orders.removeLine');
    Route::patch('pos/orders/{order}/waiter',           [PosOrderController::class, 'assignWaiter'])->name('pos.orders.waiter');
    Route::get('pos/orders/{order}/prebill',            [PosOrderController::class, 'preBill'])->name('pos.orders.preBill');
    Route::post('pos/orders/{order}/checkout',          [PosOrderController::class, 'checkout'])->name('pos.orders.checkout');
    Route::post('pos/orders/{order}/cancel',            [PosOrderController::class, 'cancel'])->name('pos.orders.cancel');

    // ── Meseros ───────────────────────────────────────────────────────────────
    Route::get('pos/waiters/create',          [PosWaiterController::class, 'create'])->name('pos.waiters.create');
    Route::post('pos/waiters',                [PosWaiterController::class, 'store'])->name('pos.waiters.store');
    Route::get('pos/waiters',                 [PosWaiterController::class, 'index'])->name('pos.waiters.index');
    Route::get('pos/waiters/{waiter}/edit',   [PosWaiterController::class, 'edit'])->name('pos.waiters.edit');
    Route::put('pos/waiters/{waiter}',        [PosWaiterController::class, 'update'])->name('pos.waiters.update');
    Route::delete('pos/waiters/{waiter}',     [PosWaiterController::class, 'destroy'])->name('pos.waiters.destroy');
});
