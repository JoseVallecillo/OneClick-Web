<?php

use Illuminate\Support\Facades\Route;
use Modules\CarService\Http\Controllers\ServiceOrderController;
use Modules\CarService\Http\Controllers\VehicleController;

// ── Public QR History (no auth required) ─────────────────────────────────────
Route::get('cs/history/{token}', [ServiceOrderController::class, 'publicHistory'])
    ->name('carservice.public.history');

// ── Authenticated Routes ──────────────────────────────────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {

    // Entry point redirect
    Route::get('carservice', fn () => redirect()->route('carservice.orders.index'))
        ->name('carservice');

    // ── Service Orders ────────────────────────────────────────────────────────
    Route::get('carservice/orders',                 [ServiceOrderController::class, 'index'])->name('carservice.orders.index');
    Route::get('carservice/orders/create',          [ServiceOrderController::class, 'create'])->name('carservice.checkin.create');
    Route::post('carservice/orders',                [ServiceOrderController::class, 'store'])->name('carservice.orders.store');
    Route::get('carservice/orders/{order}',         [ServiceOrderController::class, 'show'])->name('carservice.orders.show');
    Route::get('carservice/orders/{order}/edit',    [ServiceOrderController::class, 'edit'])->name('carservice.orders.edit');
    Route::patch('carservice/orders/{order}',       [ServiceOrderController::class, 'update'])->name('carservice.orders.update');

    // Recipe (Services/Materials) management
    Route::post('carservice/orders/{order}/cancel', [ServiceOrderController::class, 'cancel'])->name('carservice.orders.cancel');
    Route::post('carservice/orders/{order}/convert', [ServiceOrderController::class, 'convertToOrder'])->name('carservice.orders.convert');
    Route::get('carservice/orders/{order}/recipe',   [ServiceOrderController::class, 'recipe'])->name('carservice.orders.recipe');
    Route::patch('carservice/orders/{order}/recipe', [ServiceOrderController::class, 'updateRecipe'])->name('carservice.orders.recipe.update');

    // Complete workflow
    Route::get('carservice/orders/{order}/complete',  [ServiceOrderController::class, 'complete'])->name('carservice.orders.complete');
    Route::post('carservice/orders/{order}/complete', [ServiceOrderController::class, 'storeComplete'])->name('carservice.orders.complete.store');

    Route::post('carservice/orders/{order}/cancel', [ServiceOrderController::class, 'cancel'])->name('carservice.orders.cancel');

    // ── Vehicles ──────────────────────────────────────────────────────────────
    Route::get('carservice/vehicles',               [VehicleController::class, 'index'])->name('carservice.vehicles.index');
    Route::post('carservice/vehicles',              [VehicleController::class, 'store'])->name('carservice.vehicles.store');
    Route::get('carservice/vehicles/{vehicle}/edit', [VehicleController::class, 'edit'])->name('carservice.vehicles.edit');
    Route::patch('carservice/vehicles/{vehicle}',   [VehicleController::class, 'update'])->name('carservice.vehicles.update');

    // ── AJAX: Lookup ─────────────────────────────────────────────────────────
    Route::get('carservice/vehicles/lookup', [VehicleController::class, 'lookup'])->name('carservice.vehicles.lookup');
    Route::get('carservice/customers/lookup', [ServiceOrderController::class, 'lookupCustomers'])->name('carservice.customers.lookup');
    Route::get('carservice/products/lookup', [ServiceOrderController::class, 'lookupProducts'])->name('carservice.products.lookup');
});
