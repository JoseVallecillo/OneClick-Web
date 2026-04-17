<?php

use Illuminate\Support\Facades\Route;
use Modules\Users\Http\Controllers\UsersController;

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard (admin only — enforced in controller)
    Route::get('users', [UsersController::class, 'index'])->name('users.index');

    // ── User management ────────────────────────────────────────────────────────
    Route::post('users', [UsersController::class, 'storeUser'])->name('users.store');
    Route::patch('users/{user}/role', [UsersController::class, 'updateRole'])->name('users.update-role');
    Route::patch('users/{user}/profile', [UsersController::class, 'assignProfile'])->name('users.assign-profile');
    Route::patch('users/{user}/exceptions', [UsersController::class, 'updateExceptions'])->name('users.update-exceptions');
    Route::delete('users/{user}', [UsersController::class, 'deleteUser'])->name('users.delete');

    // ── Profile management ─────────────────────────────────────────────────────
    Route::post('users/profiles', [UsersController::class, 'storeProfile'])->name('users.profiles.store');
    Route::patch('users/profiles/{profile}', [UsersController::class, 'updateProfile'])->name('users.profiles.update');
    Route::delete('users/profiles/{profile}', [UsersController::class, 'deleteProfile'])->name('users.profiles.delete');
});
