<?php

use Illuminate\Support\Facades\Route;
use Modules\Pos\Http\Controllers\PosSessionController;
use Modules\Pos\Http\Controllers\PosSaleController;
use Modules\Pos\Http\Controllers\PosTableController;

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

    // ── Terminal POS ──────────────────────────────────────────────────────────
    Route::get('pos/sessions/{session}/sell',  [PosSaleController::class, 'sell'])->name('pos.sell');
    Route::post('pos/sessions/{session}/sales',[PosSaleController::class, 'store'])->name('pos.sales.store');

    // ── Recibos y anulaciones ──────────────────────────────────────────────────
    Route::get('pos/sales/{sale}/receipt',     [PosSaleController::class, 'receipt'])->name('pos.sales.receipt');
    Route::post('pos/sales/{sale}/void',       [PosSaleController::class, 'void'])->name('pos.sales.void');

    // ── Table Board (restaurante) ─────────────────────────────────────────────
    Route::get('pos/tables',                         [PosTableController::class, 'index'])->name('pos.tables.index');
    Route::post('pos/tables/{table}/open',           [PosTableController::class, 'openTable'])->name('pos.tables.open');
    Route::patch('pos/tables/{table}/status',        [PosTableController::class, 'updateStatus'])->name('pos.tables.updateStatus');
    Route::post('pos/tables/{table}/close',          [PosTableController::class, 'closeTable'])->name('pos.tables.close');
});
