<?php

use Illuminate\Support\Facades\Route;
use Modules\Governance\Http\Controllers\GovernanceController;

Route::middleware(['auth', 'verified'])->group(function () {
    // Admin UI
    Route::get('governance', [GovernanceController::class, 'index'])->name('governance.index');

    // Rule management (admin only — enforced in controller)
    Route::post('governance/rules', [GovernanceController::class, 'addRule'])->name('governance.rules.add');
    Route::patch('governance/rules/{rule}/toggle', [GovernanceController::class, 'toggleRule'])->name('governance.rules.toggle');
    Route::delete('governance/rules/{rule}', [GovernanceController::class, 'deleteRule'])->name('governance.rules.delete');
    Route::get('governance/modules/{module}/elements', [GovernanceController::class, 'getModuleElements'])->name('governance.elements');

    // Field validator management (admin only)
    Route::post('governance/field-validators', [GovernanceController::class, 'addFieldValidator'])->name('governance.field-validators.add');
    Route::patch('governance/field-validators/{validator}/toggle', [GovernanceController::class, 'toggleFieldValidator'])->name('governance.field-validators.toggle');
    Route::delete('governance/field-validators/{validator}', [GovernanceController::class, 'deleteFieldValidator'])->name('governance.field-validators.delete');

    // PIN validation (called via fetch from GovernanceWrapper)
    Route::post('governance/check-pin', [GovernanceController::class, 'checkPin'])->name('governance.check-pin');

    // Authorization flow (called via fetch from GovernanceWrapper)
    Route::post('governance/request-authorization', [GovernanceController::class, 'requestAuthorization'])->name('governance.request-authorization');
    Route::get('governance/check-authorization/{token}', [GovernanceController::class, 'checkAuthorization'])->name('governance.check-authorization');
    Route::post('governance/approve-authorization/{token}', [GovernanceController::class, 'approveAuthorization'])->name('governance.approve-authorization');
    Route::post('governance/reject-authorization/{token}', [GovernanceController::class, 'rejectAuthorization'])->name('governance.reject-authorization');
});
