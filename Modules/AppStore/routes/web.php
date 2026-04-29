<?php

use Illuminate\Support\Facades\Route;
use Modules\AppStore\Http\Controllers\AppStoreController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('app-store', [AppStoreController::class, 'index'])->name('app-store');
    Route::post('app-store/{module}/install', [AppStoreController::class, 'install'])->name('app-store.install');
    Route::post('app-store/{module}/uninstall', [AppStoreController::class, 'uninstall'])->name('app-store.uninstall');
});
