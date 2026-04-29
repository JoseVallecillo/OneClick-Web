<?php

use Illuminate\Support\Facades\Route;
use Modules\Contacts\Http\Controllers\ContactsController;
use Modules\Contacts\Http\Controllers\ContactBankDetailsController;
use Modules\Contacts\Http\Controllers\ContactCommunicationsController;
use Modules\Contacts\Http\Controllers\ContactDocumentsController;
use Modules\Contacts\Http\Controllers\ContactDuplicateController;
use Modules\Contacts\Http\Controllers\ContactPaymentTermsController;
use Modules\Contacts\Http\Controllers\ContactReportsController;
use Modules\Contacts\Http\Controllers\ContactTagsController;
use Modules\Contacts\Http\Controllers\SupplierEvaluationController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('contacts', ContactsController::class);
    Route::apiResource('contact-bank-details', ContactBankDetailsController::class);
    Route::apiResource('contact-communications', ContactCommunicationsController::class);
    Route::apiResource('contact-documents', ContactDocumentsController::class);
    Route::apiResource('contact-duplicates', ContactDuplicateController::class);
    Route::apiResource('contact-payment-terms', ContactPaymentTermsController::class);
    Route::apiResource('contact-tags', ContactTagsController::class);
    Route::apiResource('supplier-evaluations', SupplierEvaluationController::class);

    Route::get('contacts/lookup', [ContactsController::class, 'lookup']);
    Route::get('reports/client-classification', [ContactReportsController::class, 'clientClassification']);
    Route::get('reports/communication-activity', [ContactReportsController::class, 'communicationActivity']);
    Route::get('reports/debtors', [ContactReportsController::class, 'debtors']);
    Route::get('reports/supplier-analysis', [ContactReportsController::class, 'supplierAnalysis']);
});
