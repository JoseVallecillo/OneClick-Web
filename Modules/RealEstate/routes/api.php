<?php

use Illuminate\Support\Facades\Route;
use Modules\RealEstate\Http\Controllers\PropertyController;
use Modules\RealEstate\Http\Controllers\RealEstateDealController;
use Modules\RealEstate\Http\Controllers\RealEstateLeadController;
use Modules\RealEstate\Http\Controllers\CommissionController;
use Modules\RealEstate\Http\Controllers\CondoFeeController;
use Modules\RealEstate\Http\Controllers\PaymentPlanController;
use Modules\RealEstate\Http\Controllers\SupportTicketController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('properties', PropertyController::class);
    Route::apiResource('deals', RealEstateDealController::class);
    Route::apiResource('leads', RealEstateLeadController::class);
    Route::apiResource('commissions', CommissionController::class);
    Route::apiResource('condo-fees', CondoFeeController::class);
    Route::apiResource('payment-plans', PaymentPlanController::class);
    Route::apiResource('support-tickets', SupportTicketController::class);
});
