<?php

use Illuminate\Support\Facades\Route;
use Modules\Rentals\Http\Controllers\RentalOrderController;
use Modules\Rentals\Http\Controllers\RentalRateController;
use Modules\Rentals\Http\Controllers\RentalReportController;

Route::middleware(['auth', 'verified'])->group(function () {

    // ── Orders ────────────────────────────────────────────────────────────────
    Route::get('rentals',                 [RentalOrderController::class, 'index'])        ->name('rentals.index');
    Route::get('rentals/calendar',        [RentalOrderController::class, 'calendar'])     ->name('rentals.calendar');
    Route::get('rentals/create',          [RentalOrderController::class, 'create'])       ->name('rentals.create');
    Route::post('rentals',                [RentalOrderController::class, 'store'])         ->name('rentals.store');
    Route::get('rentals/{order}',         [RentalOrderController::class, 'show'])         ->name('rentals.show');
    Route::get('rentals/{order}/edit',    [RentalOrderController::class, 'edit'])         ->name('rentals.edit');
    Route::patch('rentals/{order}',       [RentalOrderController::class, 'update'])       ->name('rentals.update');
    Route::delete('rentals/{order}',      [RentalOrderController::class, 'destroy'])      ->name('rentals.destroy');

    // Workflow
    Route::post('rentals/{order}/confirm',       [RentalOrderController::class, 'confirm'])      ->name('rentals.confirm');
    Route::get('rentals/{order}/deliver',        [RentalOrderController::class, 'deliver'])      ->name('rentals.deliver');
    Route::post('rentals/{order}/deliver',       [RentalOrderController::class, 'storeDeliver']) ->name('rentals.deliver.store');
    Route::get('rentals/{order}/return',         [RentalOrderController::class, 'return'])       ->name('rentals.return');
    Route::post('rentals/{order}/return',        [RentalOrderController::class, 'storeReturn'])  ->name('rentals.return.store');
    Route::post('rentals/{order}/extend',        [RentalOrderController::class, 'extend'])       ->name('rentals.extend');
    Route::post('rentals/{order}/invoice',       [RentalOrderController::class, 'invoice'])      ->name('rentals.invoice');
    Route::post('rentals/{order}/close',         [RentalOrderController::class, 'close'])        ->name('rentals.close');

    // ── Rates ─────────────────────────────────────────────────────────────────
    Route::get('rentals/config/rates',           [RentalRateController::class, 'index'])   ->name('rentals.rates.index');
    Route::post('rentals/config/rates',          [RentalRateController::class, 'store'])   ->name('rentals.rates.store');
    Route::patch('rentals/config/rates/{rate}',  [RentalRateController::class, 'update'])  ->name('rentals.rates.update');
    Route::delete('rentals/config/rates/{rate}', [RentalRateController::class, 'destroy']) ->name('rentals.rates.destroy');

    // ── Reports ───────────────────────────────────────────────────────────────
    Route::get('rentals/reports/overview', [RentalReportController::class, 'index'])->name('rentals.reports.index');

    // ── Lookups (AJAX) ────────────────────────────────────────────────────────
    Route::get('rentals/lookup/products',     [RentalOrderController::class, 'lookupProducts'])   ->name('rentals.lookup.products');
    Route::get('rentals/lookup/customers',    [RentalOrderController::class, 'lookupCustomers'])  ->name('rentals.lookup.customers');
    Route::get('rentals/lookup/availability', [RentalOrderController::class, 'checkAvailability'])->name('rentals.lookup.availability');
});
