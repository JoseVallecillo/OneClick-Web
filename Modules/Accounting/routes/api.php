<?php

use Illuminate\Support\Facades\Route;
use Modules\Accounting\Http\Controllers\AccountController;
use Modules\Accounting\Http\Controllers\AnalyticalAccountController;
use Modules\Accounting\Http\Controllers\AccountingPeriodController;
use Modules\Accounting\Http\Controllers\BankReconciliationController;
use Modules\Accounting\Http\Controllers\BudgetController;
use Modules\Accounting\Http\Controllers\CaiConfigController;
use Modules\Accounting\Http\Controllers\CurrencyController;
use Modules\Accounting\Http\Controllers\FixedAssetController;
use Modules\Accounting\Http\Controllers\JournalController;
use Modules\Accounting\Http\Controllers\MoveController;
use Modules\Accounting\Http\Controllers\ReportController;
use Modules\Accounting\Http\Controllers\TaxController;
use Modules\Accounting\Http\Controllers\WithholdingController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('accounts', AccountController::class);
    Route::apiResource('analytical-accounts', AnalyticalAccountController::class);
    Route::apiResource('accounting-periods', AccountingPeriodController::class);
    Route::apiResource('bank-reconciliations', BankReconciliationController::class);
    Route::apiResource('budgets', BudgetController::class);
    Route::apiResource('cai-configs', CaiConfigController::class);
    Route::apiResource('currencies', CurrencyController::class);
    Route::apiResource('fixed-assets', FixedAssetController::class);
    Route::apiResource('journals', JournalController::class);
    Route::apiResource('moves', MoveController::class);
    Route::apiResource('taxes', TaxController::class);
    Route::apiResource('withholdings', WithholdingController::class);

    Route::get('reports/balance-sheet', [ReportController::class, 'balanceSheet']);
    Route::get('reports/income-statement', [ReportController::class, 'incomeStatement']);
    Route::get('reports/trial-balance', [ReportController::class, 'trialBalance']);
    Route::get('reports/general-ledger', [ReportController::class, 'generalLedger']);
    Route::get('reports/analytical-ledger', [ReportController::class, 'analyticalLedger']);
    Route::get('reports/analytical-balance', [ReportController::class, 'analyticalBalance']);
    Route::get('reports/fixed-assets', [ReportController::class, 'fixedAssetsReport']);
    Route::get('reports/budget-vs-actual', [ReportController::class, 'budgetVsActual']);

    Route::post('moves/{move}/post', [MoveController::class, 'post']);
    Route::post('moves/{move}/reverse', [MoveController::class, 'reverse']);
});
