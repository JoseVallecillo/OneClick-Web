<?php

use Illuminate\Support\Facades\Route;
use Modules\Settings\Http\Controllers\SettingsController;

Route::middleware(['auth', 'verified'])->group(function () {

    // ── Branch selector (no requiere sucursal activa) ──────────────────────────
    Route::get('select-branch', [SettingsController::class, 'selectBranch'])->name('branches.select');
    Route::post('select-branch', [SettingsController::class, 'setActiveBranch'])->name('branches.set-active');

    // ── Configuración general (admin only — enforced in controller) ────────────
    Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');

    // Empresa
    Route::post('settings/company', [SettingsController::class, 'updateCompany'])->name('settings.company.update');

    // Sucursales
    Route::post('settings/branches', [SettingsController::class, 'storeBranch'])->name('settings.branches.store');
    Route::patch('settings/branches/{branch}', [SettingsController::class, 'updateBranch'])->name('settings.branches.update');
    Route::delete('settings/branches/{branch}', [SettingsController::class, 'deleteBranch'])->name('settings.branches.delete');
    Route::patch('settings/branches/{branch}/users', [SettingsController::class, 'syncBranchUsers'])->name('settings.branches.users.sync');

    // Parámetros de operación
    Route::post('settings/operation', [SettingsController::class, 'updateOperation'])->name('settings.operation.update');

    // Tasas de impuesto
    Route::post('settings/tax-rates', [SettingsController::class, 'storeTaxRate'])->name('settings.tax-rates.store');
    Route::patch('settings/tax-rates/{taxRate}', [SettingsController::class, 'updateTaxRate'])->name('settings.tax-rates.update');
    Route::delete('settings/tax-rates/{taxRate}', [SettingsController::class, 'deleteTaxRate'])->name('settings.tax-rates.delete');

    // Monedas
    Route::post('settings/currencies', [SettingsController::class, 'storeCurrency'])->name('settings.currencies.store');
    Route::patch('settings/currencies/{currency}', [SettingsController::class, 'updateCurrency'])->name('settings.currencies.update');
    Route::delete('settings/currencies/{currency}', [SettingsController::class, 'deleteCurrency'])->name('settings.currencies.delete');

    // SMTP
    Route::post('settings/smtp', [SettingsController::class, 'updateSmtp'])->name('settings.smtp.update');
    Route::post('settings/smtp/test', [SettingsController::class, 'testSmtp'])->name('settings.smtp.test');
});
