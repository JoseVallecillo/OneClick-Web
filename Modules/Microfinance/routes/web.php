<?php

use Illuminate\Support\Facades\Route;
use Modules\Microfinance\app\Http\Controllers\MfClientController;
use Modules\Microfinance\app\Http\Controllers\MfCollectionController;
use Modules\Microfinance\app\Http\Controllers\MfConfigController;
use Modules\Microfinance\app\Http\Controllers\MfGroupController;
use Modules\Microfinance\app\Http\Controllers\MfLoanController;
use Modules\Microfinance\app\Http\Controllers\MfReportController;
use Modules\Microfinance\app\Http\Controllers\MfTreasuryController;

Route::middleware(['auth', 'verified'])->prefix('microfinance')->name('microfinance.')->group(function () {

    // Dashboard
    Route::get('/', [MfReportController::class, 'dashboard'])->name('dashboard');

    // Clients
    Route::get('clients',                    [MfClientController::class, 'index'])          ->name('clients.index');
    Route::get('clients/create',             [MfClientController::class, 'create'])         ->name('clients.create');
    Route::post('clients',                   [MfClientController::class, 'store'])          ->name('clients.store');
    Route::get('clients/lookup',             [MfClientController::class, 'lookup'])         ->name('clients.lookup');
    Route::get('clients/{client}',           [MfClientController::class, 'show'])           ->name('clients.show');
    Route::get('clients/{client}/edit',      [MfClientController::class, 'edit'])           ->name('clients.edit');
    Route::patch('clients/{client}',         [MfClientController::class, 'update'])         ->name('clients.update');
    Route::post('clients/{client}/snapshot', [MfClientController::class, 'storeSnapshot']) ->name('clients.snapshot');

    // Groups
    Route::get('groups',                        [MfGroupController::class, 'index'])           ->name('groups.index');
    Route::get('groups/create',                 [MfGroupController::class, 'create'])          ->name('groups.create');
    Route::post('groups',                       [MfGroupController::class, 'store'])           ->name('groups.store');
    Route::get('groups/{group}',                [MfGroupController::class, 'show'])            ->name('groups.show');
    Route::post('groups/{group}/add-member',    [MfGroupController::class, 'addMember'])       ->name('groups.add-member');
    Route::post('groups/{group}/remove-member', [MfGroupController::class, 'removeMember'])    ->name('groups.remove-member');

    // Loans
    Route::get('loans',                       [MfLoanController::class, 'index'])               ->name('loans.index');
    Route::get('loans/create',                [MfLoanController::class, 'create'])              ->name('loans.create');
    Route::post('loans',                      [MfLoanController::class, 'store'])               ->name('loans.store');
    Route::get('loans/amortization-preview',  [MfLoanController::class, 'previewAmortization']) ->name('loans.preview');
    Route::post('loans/refresh-delinquency',  [MfLoanController::class, 'refreshDelinquency'])  ->name('loans.refresh-delinquency');
    Route::get('loans/{loan}',                [MfLoanController::class, 'show'])                ->name('loans.show');
    Route::post('loans/{loan}/approve',       [MfLoanController::class, 'approve'])             ->name('loans.approve');
    Route::post('loans/{loan}/disburse',      [MfLoanController::class, 'disburse'])            ->name('loans.disburse');
    Route::post('loans/{loan}/payment',       [MfLoanController::class, 'payment'])             ->name('loans.payment');

    // Collection
    Route::get('collection/route',                [MfCollectionController::class, 'route'])        ->name('collection.route');
    Route::patch('collection/stops/{stop}',       [MfCollectionController::class, 'updateStop'])   ->name('collection.stops.update');
    Route::get('collection/promises',             [MfCollectionController::class, 'promises'])     ->name('collection.promises');
    Route::post('collection/promises',            [MfCollectionController::class, 'storePromise']) ->name('collection.promises.store');
    Route::patch('collection/promises/{promise}', [MfCollectionController::class, 'markPromise'])  ->name('collection.promises.mark');

    // Treasury
    Route::get('treasury/disbursements',                          [MfTreasuryController::class, 'disbursements'])        ->name('treasury.disbursements');
    Route::get('treasury/reconciliation',                         [MfTreasuryController::class, 'reconciliation'])       ->name('treasury.reconciliation');
    Route::post('treasury/reconciliations',                       [MfTreasuryController::class, 'createReconciliation']) ->name('treasury.reconciliations.create');
    Route::patch('treasury/reconciliation-items/{item}',          [MfTreasuryController::class, 'updateReconciliationItem']) ->name('treasury.reconciliation.item');
    Route::post('treasury/reconciliations/{reconciliation}/verify',[MfTreasuryController::class, 'verifyReconciliation']) ->name('treasury.reconciliation.verify');

    // Reports
    Route::get('reports/par',                        [MfReportController::class, 'par'])                  ->name('reports.par');
    Route::get('reports/aml-alerts',                 [MfReportController::class, 'amlAlerts'])            ->name('reports.aml-alerts');
    Route::patch('reports/aml-alerts/{alert}',       [MfReportController::class, 'reviewAmlAlert'])       ->name('reports.aml-alerts.review');
    Route::get('reports/credit-bureau',              [MfReportController::class, 'creditBureau'])         ->name('reports.credit-bureau');
    Route::post('reports/credit-bureau',             [MfReportController::class, 'generateCreditBureau']) ->name('reports.credit-bureau.generate');
    Route::get('reports/credit-bureau/{snapshot}/download', [MfReportController::class, 'downloadCreditBureau']) ->name('reports.credit-bureau.download');

    // Config
    Route::get('config/products',                 [MfConfigController::class, 'products'])      ->name('config.products');
    Route::post('config/products',                [MfConfigController::class, 'storeProduct'])  ->name('config.products.store');
    Route::patch('config/products/{product}',     [MfConfigController::class, 'updateProduct']) ->name('config.products.update');
    Route::patch('config/products/{product}/toggle', [MfConfigController::class, 'toggleProduct']) ->name('config.products.toggle');
});
