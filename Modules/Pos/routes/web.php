<?php

use Illuminate\Support\Facades\Route;
use Modules\Pos\Http\Controllers\PosOrderController;
use Modules\Pos\Http\Controllers\PosSessionController;
use Modules\Pos\Http\Controllers\PosSaleController;
use Modules\Pos\Http\Controllers\PosTableController;
use Modules\Pos\Http\Controllers\PosWaiterController;
use Modules\Pos\Http\Controllers\PosPromotionController;
use Modules\Pos\Http\Controllers\KitchenTicketController;
use Modules\Pos\Http\Controllers\PosReportController;
use Modules\Pos\Http\Controllers\PosClosingController;
use Modules\Pos\Http\Controllers\PosTransactionHistoryController;
use Modules\Pos\Http\Controllers\PosReceiptController;
use Modules\Pos\Http\Controllers\FiscalIntegrationController;

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

    // ── Promociones ───────────────────────────────────────────────────────────
    Route::get('pos/promotions/create',       [PosPromotionController::class, 'create'])->name('pos.promotions.create');
    Route::post('pos/promotions',             [PosPromotionController::class, 'store'])->name('pos.promotions.store');
    Route::get('pos/promotions',              [PosPromotionController::class, 'index'])->name('pos.promotions.index');
    Route::get('pos/promotions/{promotion}/edit', [PosPromotionController::class, 'edit'])->name('pos.promotions.edit');
    Route::put('pos/promotions/{promotion}',  [PosPromotionController::class, 'update'])->name('pos.promotions.update');
    Route::delete('pos/promotions/{promotion}', [PosPromotionController::class, 'destroy'])->name('pos.promotions.destroy');
    Route::patch('pos/promotions/{promotion}/toggle', [PosPromotionController::class, 'toggle'])->name('pos.promotions.toggle');

    // ── Cocina ─────────────────────────────────────────────────────────────────
    Route::get('pos/kitchen/tickets',         [KitchenTicketController::class, 'index'])->name('pos.kitchen.index');
    Route::get('pos/kitchen/tickets/{ticket}', [KitchenTicketController::class, 'show'])->name('pos.kitchen.show');
    Route::post('pos/kitchen/tickets/{ticket}/start', [KitchenTicketController::class, 'start'])->name('pos.kitchen.start');
    Route::post('pos/kitchen/tickets/{ticket}/complete', [KitchenTicketController::class, 'complete'])->name('pos.kitchen.complete');
    Route::post('pos/kitchen/tickets/{ticket}/cancel', [KitchenTicketController::class, 'cancel'])->name('pos.kitchen.cancel');
    Route::get('pos/kitchen/tickets/{ticket}/print', [KitchenTicketController::class, 'print'])->name('pos.kitchen.print');
    Route::post('pos/kitchen/tickets/{ticket}/reprint', [KitchenTicketController::class, 'reprint'])->name('pos.kitchen.reprint');

    // ── Reportes ───────────────────────────────────────────────────────────────
    Route::get('pos/reports/sales-by-period', [PosReportController::class, 'salesByPeriod'])->name('pos.reports.sales-by-period');
    Route::get('pos/reports/sales-by-waiter', [PosReportController::class, 'salesByWaiter'])->name('pos.reports.sales-by-waiter');
    Route::get('pos/reports/sales-by-table',  [PosReportController::class, 'salesByTable'])->name('pos.reports.sales-by-table');
    Route::get('pos/reports/product-analysis', [PosReportController::class, 'productAnalysis'])->name('pos.reports.product-analysis');
    Route::get('pos/reports/void-report',     [PosReportController::class, 'voidReport'])->name('pos.reports.void-report');
    Route::get('pos/reports/session-report',  [PosReportController::class, 'sessionReport'])->name('pos.reports.session-report');

    // ── Cierre de caja ─────────────────────────────────────────────────────────
    Route::get('pos/sessions/{session}/closing', [PosClosingController::class, 'show'])->name('pos.closing.show');
    Route::post('pos/sessions/{session}/closing', [PosClosingController::class, 'store'])->name('pos.closing.store');

    // ── Historial de transacciones ─────────────────────────────────────────────
    Route::get('pos/history',                 [PosTransactionHistoryController::class, 'index'])->name('pos.history.index');
    Route::get('pos/history/{sale}',          [PosTransactionHistoryController::class, 'show'])->name('pos.history.show');
    Route::get('pos/history/export',          [PosTransactionHistoryController::class, 'export'])->name('pos.history.export');

    // ── Recibos ────────────────────────────────────────────────────────────────
    Route::get('pos/sales/{sale}/receipt-details', [PosReceiptController::class, 'show'])->name('pos.receipt.show');
    Route::get('pos/sales/{sale}/receipt',    [PosReceiptController::class, 'receipt'])->name('pos.receipt');
    Route::post('pos/sales/{sale}/receipt/reprint', [PosReceiptController::class, 'reprint'])->name('pos.receipt.reprint');
    Route::get('pos/sales/{sale}/kitchen-ticket', [PosReceiptController::class, 'kitchenTicket'])->name('pos.kitchen-ticket');
    Route::get('pos/sales/{sale}/reprints',   [PosReceiptController::class, 'reprints'])->name('pos.reprints');

    // ── Integración Fiscal (SAR Honduras) ───────────────────────────────────────
    Route::get('pos/fiscal/documents',        [FiscalIntegrationController::class, 'index'])->name('pos.fiscal.index');
    Route::get('pos/fiscal/documents/{document}', [FiscalIntegrationController::class, 'show'])->name('pos.fiscal.show');
    Route::post('pos/fiscal/documents/{document}/authorize', [FiscalIntegrationController::class, 'authorize'])->name('pos.fiscal.authorize');
    Route::post('pos/fiscal/documents/{document}/retry', [FiscalIntegrationController::class, 'retry'])->name('pos.fiscal.retry');
    Route::post('pos/fiscal/documents/{document}/cancel', [FiscalIntegrationController::class, 'cancel'])->name('pos.fiscal.cancel');
    Route::get('pos/sales/{sale}/fiscal-status', [FiscalIntegrationController::class, 'status'])->name('pos.fiscal.status');
    Route::get('pos/fiscal/validate-cai',    [FiscalIntegrationController::class, 'validateCai'])->name('pos.fiscal.validate-cai');
});
