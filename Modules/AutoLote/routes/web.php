<?php

use Illuminate\Support\Facades\Route;
use Modules\AutoLote\Http\Controllers\ExpenseController;
use Modules\AutoLote\Http\Controllers\SaleController;
use Modules\AutoLote\Http\Controllers\VehicleController;

Route::middleware(['auth', 'verified'])->prefix('autolote')->name('autolote.')->group(function () {

    // Vehicles — CRUD
    Route::get('/vehicles',                          [VehicleController::class, 'index'])->name('vehicles.index');
    Route::get('/vehicles/create',                   [VehicleController::class, 'create'])->name('vehicles.create');
    Route::post('/vehicles',                         [VehicleController::class, 'store'])->name('vehicles.store');
    Route::get('/vehicles/{vehicle}',                [VehicleController::class, 'show'])->name('vehicles.show');
    Route::get('/vehicles/{vehicle}/edit',           [VehicleController::class, 'edit'])->name('vehicles.edit');
    Route::patch('/vehicles/{vehicle}',              [VehicleController::class, 'update'])->name('vehicles.update');
    Route::delete('/vehicles/{vehicle}',             [VehicleController::class, 'destroy'])->name('vehicles.destroy');

    // Vehicles — lifecycle
    Route::post('/vehicles/{vehicle}/transition',    [VehicleController::class, 'transition'])->name('vehicles.transition');

    // Expenses
    Route::post('/vehicles/{vehicle}/expenses',                      [ExpenseController::class, 'store'])->name('vehicles.expenses.store');
    Route::delete('/vehicles/{vehicle}/expenses/{expense}',          [ExpenseController::class, 'destroy'])->name('vehicles.expenses.destroy');

    // Sales
    Route::get('/vehicles/{vehicle}/sell',           [SaleController::class, 'create'])->name('vehicles.sell');
    Route::post('/vehicles/{vehicle}/sell',          [SaleController::class, 'store'])->name('vehicles.sell.store');

    // Loan payments
    Route::post('/loans/{loan}/payments/{payment}/pay', [SaleController::class, 'registerPayment'])->name('loans.payments.pay');
});
