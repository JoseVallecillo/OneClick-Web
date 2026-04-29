<?php

use Illuminate\Support\Facades\Route;
use Modules\AppStore\Http\Controllers\AppStoreController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('appstores', AppStoreController::class)->names('appstore');
});
