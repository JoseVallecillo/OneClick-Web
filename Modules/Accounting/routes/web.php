<?php

use Illuminate\Support\Facades\Route;
use Modules\Accounting\Http\Controllers\AccountController;
use Modules\Accounting\Http\Controllers\AnalyticalAccountController;
use Modules\Accounting\Http\Controllers\AccountingPeriodController;
use Modules\Accounting\Http\Controllers\BankReconciliationController;
use Modules\Accounting\Http\Controllers\BudgetController;
use Modules\Accounting\Http\Controllers\CaiConfigController;
use Modules\Accounting\Http\Controllers\FixedAssetController;
use Modules\Accounting\Http\Controllers\JournalController;
use Modules\Accounting\Http\Controllers\MoveController;
use Modules\Accounting\Http\Controllers\ReportController;
use Modules\Accounting\Http\Controllers\CurrencyController;
use Modules\Accounting\Http\Controllers\TaxController;
use Modules\Accounting\Http\Controllers\WithholdingController;

Route::middleware(['auth', 'verified'])->group(function () {

    // ── Entrada principal ──────────────────────────────────────────────────────
    Route::get('accounting', fn () => redirect()->route('accounting.moves.index'))
        ->name('accounting');

    // ── Catálogo de Cuentas ────────────────────────────────────────────────────
    Route::get('accounting/accounts',              [AccountController::class, 'index'])->name('accounting.accounts.index');
    Route::get('accounting/accounts/create',       [AccountController::class, 'create'])->name('accounting.accounts.create');
    Route::post('accounting/accounts',             [AccountController::class, 'store'])->name('accounting.accounts.store');
    Route::get('accounting/accounts/{account}/edit', [AccountController::class, 'edit'])->name('accounting.accounts.edit');
    Route::patch('accounting/accounts/{account}',  [AccountController::class, 'update'])->name('accounting.accounts.update');

    // ── Cuentas Analíticas ─────────────────────────────────────────────────────
    Route::get('accounting/analytical-accounts',                      [AnalyticalAccountController::class, 'index'])->name('accounting.analytical-accounts.index');
    Route::get('accounting/analytical-accounts/create',               [AnalyticalAccountController::class, 'create'])->name('accounting.analytical-accounts.create');
    Route::post('accounting/analytical-accounts',                     [AnalyticalAccountController::class, 'store'])->name('accounting.analytical-accounts.store');
    Route::get('accounting/analytical-accounts/{analyticalAccount}/edit', [AnalyticalAccountController::class, 'edit'])->name('accounting.analytical-accounts.edit');
    Route::patch('accounting/analytical-accounts/{analyticalAccount}', [AnalyticalAccountController::class, 'update'])->name('accounting.analytical-accounts.update');

    // ── Diarios ────────────────────────────────────────────────────────────────
    Route::get('accounting/journals',              [JournalController::class, 'index'])->name('accounting.journals.index');
    Route::get('accounting/journals/create',       [JournalController::class, 'create'])->name('accounting.journals.create');
    Route::post('accounting/journals',             [JournalController::class, 'store'])->name('accounting.journals.store');
    Route::get('accounting/journals/{journal}/edit', [JournalController::class, 'edit'])->name('accounting.journals.edit');
    Route::patch('accounting/journals/{journal}',  [JournalController::class, 'update'])->name('accounting.journals.update');

    // ── Asientos Contables (Libro Diario) ──────────────────────────────────────
    Route::get('accounting/moves',                 [MoveController::class, 'index'])->name('accounting.moves.index');
    Route::get('accounting/moves/create',          [MoveController::class, 'create'])->name('accounting.moves.create');
    Route::post('accounting/moves',                [MoveController::class, 'store'])->name('accounting.moves.store');
    Route::get('accounting/moves/{move}',          [MoveController::class, 'show'])->name('accounting.moves.show');
    Route::get('accounting/moves/{move}/edit',     [MoveController::class, 'edit'])->name('accounting.moves.edit');
    Route::patch('accounting/moves/{move}',        [MoveController::class, 'update'])->name('accounting.moves.update');
    Route::delete('accounting/moves/{move}',       [MoveController::class, 'destroy'])->name('accounting.moves.destroy');

    // ── Transiciones de Workflow ───────────────────────────────────────────────
    Route::post('accounting/moves/{move}/post',    [MoveController::class, 'post'])->name('accounting.moves.post');
    Route::post('accounting/moves/{move}/reverse', [MoveController::class, 'reverse'])->name('accounting.moves.reverse');

    // ── Monedas ────────────────────────────────────────────────────────────────
    Route::get('accounting/currencies',                  [CurrencyController::class, 'index'])->name('accounting.currencies.index');
    Route::get('accounting/currencies/create',           [CurrencyController::class, 'create'])->name('accounting.currencies.create');
    Route::post('accounting/currencies',                 [CurrencyController::class, 'store'])->name('accounting.currencies.store');
    Route::get('accounting/currencies/{currency}/edit',  [CurrencyController::class, 'edit'])->name('accounting.currencies.edit');
    Route::patch('accounting/currencies/{currency}',     [CurrencyController::class, 'update'])->name('accounting.currencies.update');
    Route::delete('accounting/currencies/{currency}',    [CurrencyController::class, 'destroy'])->name('accounting.currencies.destroy');

    // ── Impuestos ──────────────────────────────────────────────────────────────
    Route::get('accounting/taxes',                 [TaxController::class, 'index'])->name('accounting.taxes.index');
    Route::get('accounting/taxes/create',          [TaxController::class, 'create'])->name('accounting.taxes.create');
    Route::post('accounting/taxes',                [TaxController::class, 'store'])->name('accounting.taxes.store');
    Route::get('accounting/taxes/{tax}/edit',      [TaxController::class, 'edit'])->name('accounting.taxes.edit');
    Route::patch('accounting/taxes/{tax}',         [TaxController::class, 'update'])->name('accounting.taxes.update');
    Route::delete('accounting/taxes/{tax}',        [TaxController::class, 'destroy'])->name('accounting.taxes.destroy');

    // ── Retenciones (Honduras) ─────────────────────────────────────────────────
    Route::get('accounting/withholdings',                 [WithholdingController::class, 'index'])->name('accounting.withholdings.index');
    Route::get('accounting/withholdings/create',          [WithholdingController::class, 'create'])->name('accounting.withholdings.create');
    Route::post('accounting/withholdings',                [WithholdingController::class, 'store'])->name('accounting.withholdings.store');
    Route::get('accounting/withholdings/{withholding}/edit', [WithholdingController::class, 'edit'])->name('accounting.withholdings.edit');
    Route::patch('accounting/withholdings/{withholding}', [WithholdingController::class, 'update'])->name('accounting.withholdings.update');

    // ── Períodos Contables ─────────────────────────────────────────────────────
    Route::get('accounting/periods',                 [AccountingPeriodController::class, 'index'])->name('accounting.periods.index');
    Route::get('accounting/periods/create',          [AccountingPeriodController::class, 'create'])->name('accounting.periods.create');
    Route::post('accounting/periods',                [AccountingPeriodController::class, 'store'])->name('accounting.periods.store');
    Route::get('accounting/periods/{period}/edit',   [AccountingPeriodController::class, 'edit'])->name('accounting.periods.edit');
    Route::patch('accounting/periods/{period}',      [AccountingPeriodController::class, 'update'])->name('accounting.periods.update');
    Route::post('accounting/periods/{period}/close', [AccountingPeriodController::class, 'close'])->name('accounting.periods.close');

    // ── Activos Fijos ──────────────────────────────────────────────────────────
    Route::get('accounting/fixed-assets',                [FixedAssetController::class, 'index'])->name('accounting.fixed-assets.index');
    Route::get('accounting/fixed-assets/create',         [FixedAssetController::class, 'create'])->name('accounting.fixed-assets.create');
    Route::post('accounting/fixed-assets',               [FixedAssetController::class, 'store'])->name('accounting.fixed-assets.store');
    Route::get('accounting/fixed-assets/{fixedAsset}/edit', [FixedAssetController::class, 'edit'])->name('accounting.fixed-assets.edit');
    Route::patch('accounting/fixed-assets/{fixedAsset}', [FixedAssetController::class, 'update'])->name('accounting.fixed-assets.update');

    // ── Conciliación Bancaria ──────────────────────────────────────────────────
    Route::get('accounting/bank-reconciliations',              [BankReconciliationController::class, 'index'])->name('accounting.bank-reconciliations.index');
    Route::get('accounting/bank-reconciliations/create',       [BankReconciliationController::class, 'create'])->name('accounting.bank-reconciliations.create');
    Route::post('accounting/bank-reconciliations',             [BankReconciliationController::class, 'store'])->name('accounting.bank-reconciliations.store');
    Route::get('accounting/bank-reconciliations/{reconciliation}', [BankReconciliationController::class, 'show'])->name('accounting.bank-reconciliations.show');
    Route::post('accounting/bank-reconciliations/{reconciliation}/reconcile', [BankReconciliationController::class, 'reconcile'])->name('accounting.bank-reconciliations.reconcile');

    // ── Presupuestos ───────────────────────────────────────────────────────────
    Route::get('accounting/budgets',                 [BudgetController::class, 'index'])->name('accounting.budgets.index');
    Route::get('accounting/budgets/create',          [BudgetController::class, 'create'])->name('accounting.budgets.create');
    Route::post('accounting/budgets',                [BudgetController::class, 'store'])->name('accounting.budgets.store');
    Route::get('accounting/budgets/{budget}',        [BudgetController::class, 'show'])->name('accounting.budgets.show');
    Route::post('accounting/budgets/{budget}/approve', [BudgetController::class, 'approve'])->name('accounting.budgets.approve');

    // ── Configuración CAI (Honduras SAR) ──────────────────────────────────────
    Route::get('accounting/cai',                          [CaiConfigController::class, 'index'])->name('accounting.cai.index');
    Route::get('accounting/cai/create',                   [CaiConfigController::class, 'create'])->name('accounting.cai.create');
    Route::post('accounting/cai',                         [CaiConfigController::class, 'store'])->name('accounting.cai.store');
    Route::get('accounting/cai/{caiConfig}',              [CaiConfigController::class, 'show'])->name('accounting.cai.show');
    Route::get('accounting/cai/{caiConfig}/edit',         [CaiConfigController::class, 'edit'])->name('accounting.cai.edit');
    Route::patch('accounting/cai/{caiConfig}',            [CaiConfigController::class, 'update'])->name('accounting.cai.update');

    // ── Reportes ───────────────────────────────────────────────────────────────
    Route::get('accounting/reports/trial-balance',        [ReportController::class, 'trialBalance'])->name('accounting.reports.trial-balance');
    Route::get('accounting/reports/general-ledger',       [ReportController::class, 'generalLedger'])->name('accounting.reports.general-ledger');
    Route::get('accounting/reports/analytical-balance',   [ReportController::class, 'analyticalBalance'])->name('accounting.reports.analytical-balance');
    Route::get('accounting/reports/analytical-ledger',    [ReportController::class, 'analyticalLedger'])->name('accounting.reports.analytical-ledger');
    Route::get('accounting/reports/balance-sheet',        [ReportController::class, 'balanceSheet'])->name('accounting.reports.balance-sheet');
    Route::get('accounting/reports/income-statement',     [ReportController::class, 'incomeStatement'])->name('accounting.reports.income-statement');
    Route::get('accounting/reports/fixed-assets',        [ReportController::class, 'fixedAssetsReport'])->name('accounting.reports.fixed-assets');
    Route::get('accounting/reports/budget-vs-actual',     [ReportController::class, 'budgetVsActual'])->name('accounting.reports.budget-vs-actual');
});
