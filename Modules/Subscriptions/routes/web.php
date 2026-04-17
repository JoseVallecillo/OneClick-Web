<?php

use Illuminate\Support\Facades\Route;
use Modules\Subscriptions\Http\Controllers\SubscriptionsController;

Route::middleware(['web', 'auth'])->group(function () {
    // Panel de gestión de suscripciones
    Route::get('/subscriptions', [SubscriptionsController::class, 'index'])
        ->name('subscriptions.index');

    // Generar y enviar token de activación
    Route::post('/subscriptions/generate-token', [SubscriptionsController::class, 'generateToken'])
        ->name('subscriptions.generate-token');

    // Reenviar correo de token pendiente
    Route::post('/subscriptions/tokens/{token}/resend', [SubscriptionsController::class, 'resendToken'])
        ->name('subscriptions.tokens.resend');

    // Revocar token
    Route::patch('/subscriptions/tokens/{token}/revoke', [SubscriptionsController::class, 'revokeToken'])
        ->name('subscriptions.tokens.revoke');

    // Activación por PIN (solo desarrollo)
    Route::post('/subscriptions/activate-pin', [SubscriptionsController::class, 'activateByPin'])
        ->name('subscriptions.activate-pin');

    // Desactivar suscripción
    Route::patch('/subscriptions/{subscription}/deactivate', [SubscriptionsController::class, 'deactivate'])
        ->name('subscriptions.deactivate');
});

// Activación: requiere auth pero no admin (el superuser hace clic desde su correo)
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/activate-license/{token}', [SubscriptionsController::class, 'showActivate'])
        ->name('subscriptions.activate');

    Route::post('/activate-license', [SubscriptionsController::class, 'activate'])
        ->name('subscriptions.activate.confirm');
});
