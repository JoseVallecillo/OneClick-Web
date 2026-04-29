<?php

use Illuminate\Support\Facades\Route;
use Modules\Microfinance\Http\Controllers\MfClientController;
use Modules\Microfinance\Http\Controllers\MfCollectionController;
use Modules\Microfinance\Http\Controllers\MfConfigController;
use Modules\Microfinance\Http\Controllers\MfGroupController;
use Modules\Microfinance\Http\Controllers\MfLoanController;
use Modules\Microfinance\Http\Controllers\MfReportController;
use Modules\Microfinance\Http\Controllers\MfTreasuryController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('clients', MfClientController::class);
    Route::apiResource('collections', MfCollectionController::class);
    Route::apiResource('configs', MfConfigController::class);
    Route::apiResource('groups', MfGroupController::class);
    Route::apiResource('loans', MfLoanController::class);
    Route::apiResource('treasury', MfTreasuryController::class);

    Route::get('clients/lookup', [MfClientController::class, 'lookup']);
    Route::get('loans/amortization-preview', [MfLoanController::class, 'amortizationPreview']);
    Route::get('reports/portfolio', [MfReportController::class, 'portfolio']);
    Route::get('reports/collections', [MfReportController::class, 'collections']);
    Route::get('reports/delinquency', [MfReportController::class, 'delinquency']);
});
