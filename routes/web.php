<?php

use App\Http\Controllers\MediaController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified', 'check-subscription-active'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Media / Uploads
    Route::post('media/upload', [MediaController::class, 'upload'])->name('media.upload');
});

require __DIR__.'/settings.php';
