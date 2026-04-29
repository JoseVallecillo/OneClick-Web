<?php

use Illuminate\Support\Facades\Route;
use Modules\Contacts\Http\Controllers\ContactsController;
use Modules\Contacts\Http\Controllers\ContactPaymentTermsController;
use Modules\Contacts\Http\Controllers\ContactBankDetailsController;
use Modules\Contacts\Http\Controllers\ContactCommunicationsController;
use Modules\Contacts\Http\Controllers\ContactDocumentsController;
use Modules\Contacts\Http\Controllers\ContactTagsController;
use Modules\Contacts\Http\Controllers\SupplierEvaluationController;
use Modules\Contacts\Http\Controllers\ContactReportsController;
use Modules\Contacts\Http\Controllers\ContactDuplicateController;

Route::middleware(['auth', 'verified'])->group(function () {

    // ── Búsqueda dinámica ────────────────────────────────────────────────────
    Route::get('contacts/lookup', [ContactsController::class, 'lookup'])->name('contacts.lookup');

    // ── CRUD principal ────────────────────────────────────────────────────────
    Route::get('contacts', [ContactsController::class, 'index'])->name('contacts.index');
    Route::get('contacts/create', [ContactsController::class, 'create'])->name('contacts.create');
    Route::post('contacts', [ContactsController::class, 'store'])->name('contacts.store');
    Route::get('contacts/{contact}/edit', [ContactsController::class, 'edit'])->name('contacts.edit');
    Route::patch('contacts/{contact}', [ContactsController::class, 'update'])->name('contacts.update');
    Route::delete('contacts/{contact}', [ContactsController::class, 'destroy'])->name('contacts.destroy');

    // ── Direcciones ───────────────────────────────────────────────────────────
    Route::post('contacts/{contact}/addresses', [ContactsController::class, 'storeAddress'])->name('contacts.addresses.store');
    Route::patch('contacts/{contact}/addresses/{address}', [ContactsController::class, 'updateAddress'])->name('contacts.addresses.update');
    Route::delete('contacts/{contact}/addresses/{address}', [ContactsController::class, 'destroyAddress'])->name('contacts.addresses.destroy');

    // ── Personas de contacto ──────────────────────────────────────────────────
    Route::post('contacts/{contact}/persons', [ContactsController::class, 'storeContactPerson'])->name('contacts.persons.store');
    Route::patch('contacts/{contact}/persons/{person}', [ContactsController::class, 'updateContactPerson'])->name('contacts.persons.update');
    Route::delete('contacts/{contact}/persons/{person}', [ContactsController::class, 'destroyContactPerson'])->name('contacts.persons.destroy');

    // ── Términos de pago ──────────────────────────────────────────────────────
    Route::post('contacts/{contact}/payment-terms', [ContactPaymentTermsController::class, 'store'])->name('contacts.payment-terms.store');
    Route::patch('contacts/{contact}/payment-terms/{term}', [ContactPaymentTermsController::class, 'update'])->name('contacts.payment-terms.update');
    Route::delete('contacts/{contact}/payment-terms/{term}', [ContactPaymentTermsController::class, 'destroy'])->name('contacts.payment-terms.destroy');

    // ── Información bancaria ──────────────────────────────────────────────────
    Route::post('contacts/{contact}/bank-details', [ContactBankDetailsController::class, 'store'])->name('contacts.bank-details.store');
    Route::patch('contacts/{contact}/bank-details/{bank}', [ContactBankDetailsController::class, 'update'])->name('contacts.bank-details.update');
    Route::delete('contacts/{contact}/bank-details/{bank}', [ContactBankDetailsController::class, 'destroy'])->name('contacts.bank-details.destroy');

    // ── Comunicaciones ────────────────────────────────────────────────────────
    Route::get('contacts/{contact}/communications', [ContactCommunicationsController::class, 'index'])->name('contacts.communications.index');
    Route::get('contacts/{contact}/communications/create', [ContactCommunicationsController::class, 'create'])->name('contacts.communications.create');
    Route::post('contacts/{contact}/communications', [ContactCommunicationsController::class, 'store'])->name('contacts.communications.store');
    Route::get('contacts/{contact}/communications/{communication}/edit', [ContactCommunicationsController::class, 'edit'])->name('contacts.communications.edit');
    Route::patch('contacts/{contact}/communications/{communication}', [ContactCommunicationsController::class, 'update'])->name('contacts.communications.update');
    Route::delete('contacts/{contact}/communications/{communication}', [ContactCommunicationsController::class, 'destroy'])->name('contacts.communications.destroy');

    // ── Documentos ────────────────────────────────────────────────────────────
    Route::get('contacts/{contact}/documents', [ContactDocumentsController::class, 'index'])->name('contacts.documents.index');
    Route::post('contacts/{contact}/documents', [ContactDocumentsController::class, 'store'])->name('contacts.documents.store');
    Route::get('contacts/{contact}/documents/{document}/download', [ContactDocumentsController::class, 'download'])->name('contacts.documents.download');
    Route::delete('contacts/{contact}/documents/{document}', [ContactDocumentsController::class, 'destroy'])->name('contacts.documents.destroy');

    // ── Etiquetas ─────────────────────────────────────────────────────────────
    Route::get('contacts/tags', [ContactTagsController::class, 'index'])->name('contacts.tags.index');
    Route::post('contacts/tags', [ContactTagsController::class, 'store'])->name('contacts.tags.store');
    Route::patch('contacts/tags/{tag}', [ContactTagsController::class, 'update'])->name('contacts.tags.update');
    Route::delete('contacts/tags/{tag}', [ContactTagsController::class, 'destroy'])->name('contacts.tags.destroy');
    Route::post('contacts/{contact}/tags', [ContactTagsController::class, 'attachToContact'])->name('contacts.tags.attach');

    // ── Evaluación de proveedores ─────────────────────────────────────────────
    Route::get('contacts/{contact}/supplier-evaluation', [SupplierEvaluationController::class, 'create'])->name('contacts.supplier-evaluation.create');
    Route::post('contacts/{contact}/supplier-evaluation', [SupplierEvaluationController::class, 'store'])->name('contacts.supplier-evaluation.store');

    // ── Reportes ──────────────────────────────────────────────────────────────
    Route::get('contacts/reports/debtors', [ContactReportsController::class, 'debtorsReport'])->name('contacts.reports.debtors');
    Route::get('contacts/reports/suppliers', [ContactReportsController::class, 'supplierAnalysis'])->name('contacts.reports.suppliers');
    Route::get('contacts/reports/clients', [ContactReportsController::class, 'clientClassification'])->name('contacts.reports.clients');
    Route::get('contacts/reports/communications', [ContactReportsController::class, 'communicationActivity'])->name('contacts.reports.communications');

    // ── Detección de duplicados ───────────────────────────────────────────────
    Route::get('contacts/duplicates', [ContactDuplicateController::class, 'index'])->name('contacts.duplicates.index');
    Route::post('contacts/duplicates/scan', [ContactDuplicateController::class, 'scan'])->name('contacts.duplicates.scan');
    Route::post('contacts/duplicates/{duplicate}/merge', [ContactDuplicateController::class, 'merge'])->name('contacts.duplicates.merge');
    Route::post('contacts/duplicates/{duplicate}/dismiss', [ContactDuplicateController::class, 'dismiss'])->name('contacts.duplicates.dismiss');
});
