<?php

use Illuminate\Support\Facades\Route;
use Modules\RealEstate\Http\Controllers\CommissionController;
use Modules\RealEstate\Http\Controllers\CondoFeeController;
use Modules\RealEstate\Http\Controllers\PaymentPlanController;
use Modules\RealEstate\Http\Controllers\PropertyController;
use Modules\RealEstate\Http\Controllers\RealEstateDealController;
use Modules\RealEstate\Http\Controllers\RealEstateLeadController;
use Modules\RealEstate\Http\Controllers\SupportTicketController;

Route::middleware(['auth', 'verified'])->group(function () {

    // ── Properties ────────────────────────────────────────────────────────────
    Route::get('realestate/properties',                  [PropertyController::class, 'index'])   ->name('realestate.properties.index');
    Route::get('realestate/properties/create',           [PropertyController::class, 'create'])  ->name('realestate.properties.create');
    Route::post('realestate/properties',                 [PropertyController::class, 'store'])   ->name('realestate.properties.store');
    Route::get('realestate/properties/{property}',       [PropertyController::class, 'show'])    ->name('realestate.properties.show');
    Route::get('realestate/properties/{property}/edit',  [PropertyController::class, 'edit'])    ->name('realestate.properties.edit');
    Route::patch('realestate/properties/{property}',     [PropertyController::class, 'update'])  ->name('realestate.properties.update');
    Route::delete('realestate/properties/{property}',    [PropertyController::class, 'destroy']) ->name('realestate.properties.destroy');
    Route::post('realestate/properties/{property}/media',        [PropertyController::class, 'storeMedia'])   ->name('realestate.properties.media.store');
    Route::delete('realestate/properties/{property}/media/{media}', [PropertyController::class, 'destroyMedia']) ->name('realestate.properties.media.destroy');

    // ── Leads ────────────────────────────────────────────────────────────────
    Route::get('realestate/leads',                [RealEstateLeadController::class, 'index'])   ->name('realestate.leads.index');
    Route::get('realestate/leads/create',         [RealEstateLeadController::class, 'create'])  ->name('realestate.leads.create');
    Route::post('realestate/leads',               [RealEstateLeadController::class, 'store'])   ->name('realestate.leads.store');
    Route::get('realestate/leads/{lead}',         [RealEstateLeadController::class, 'show'])    ->name('realestate.leads.show');
    Route::get('realestate/leads/{lead}/edit',    [RealEstateLeadController::class, 'edit'])    ->name('realestate.leads.edit');
    Route::patch('realestate/leads/{lead}',       [RealEstateLeadController::class, 'update'])  ->name('realestate.leads.update');
    Route::delete('realestate/leads/{lead}',      [RealEstateLeadController::class, 'destroy']) ->name('realestate.leads.destroy');
    Route::post('realestate/leads/{lead}/interactions', [RealEstateLeadController::class, 'storeInteraction']) ->name('realestate.leads.interactions.store');
    Route::get('realestate/leads/matches',        [RealEstateLeadController::class, 'matches']) ->name('realestate.leads.matches');

    // ── Deals ────────────────────────────────────────────────────────────────
    Route::get('realestate/deals',               [RealEstateDealController::class, 'index'])   ->name('realestate.deals.index');
    Route::get('realestate/deals/create',        [RealEstateDealController::class, 'create'])  ->name('realestate.deals.create');
    Route::post('realestate/deals',              [RealEstateDealController::class, 'store'])   ->name('realestate.deals.store');
    Route::get('realestate/deals/{deal}',        [RealEstateDealController::class, 'show'])    ->name('realestate.deals.show');
    Route::get('realestate/deals/{deal}/edit',   [RealEstateDealController::class, 'edit'])    ->name('realestate.deals.edit');
    Route::patch('realestate/deals/{deal}',      [RealEstateDealController::class, 'update'])  ->name('realestate.deals.update');
    Route::delete('realestate/deals/{deal}',     [RealEstateDealController::class, 'destroy']) ->name('realestate.deals.destroy');

    // Deal workflow
    Route::post('realestate/deals/{deal}/reserve',       [RealEstateDealController::class, 'reserve'])      ->name('realestate.deals.reserve');
    Route::post('realestate/deals/{deal}/documents',     [RealEstateDealController::class, 'uploadDoc'])     ->name('realestate.deals.documents.upload');
    Route::patch('realestate/deals/{deal}/documents/{doc}', [RealEstateDealController::class, 'reviewDoc'])  ->name('realestate.deals.documents.review');
    Route::post('realestate/deals/{deal}/contract',      [RealEstateDealController::class, 'generateContract']) ->name('realestate.deals.contract');
    Route::post('realestate/deals/{deal}/complete',      [RealEstateDealController::class, 'complete'])      ->name('realestate.deals.complete');
    Route::post('realestate/deals/{deal}/cancel',        [RealEstateDealController::class, 'cancel'])        ->name('realestate.deals.cancel');

    // ── Payment Plans ─────────────────────────────────────────────────────────
    Route::get('realestate/payment-plans',                       [PaymentPlanController::class, 'index'])              ->name('realestate.payment-plans.index');
    Route::post('realestate/deals/{deal}/payment-plans',         [PaymentPlanController::class, 'store'])              ->name('realestate.payment-plans.store');
    Route::patch('realestate/payment-plans/{plan}/installments/{installment}', [PaymentPlanController::class, 'payInstallment']) ->name('realestate.payment-plans.pay');

    // ── Commissions ───────────────────────────────────────────────────────────
    Route::get('realestate/commissions',                        [CommissionController::class, 'index'])   ->name('realestate.commissions.index');
    Route::post('realestate/deals/{deal}/commissions',          [CommissionController::class, 'store'])   ->name('realestate.commissions.store');
    Route::post('realestate/commissions/{commission}/approve',  [CommissionController::class, 'approve']) ->name('realestate.commissions.approve');
    Route::post('realestate/commissions/{commission}/pay',      [CommissionController::class, 'pay'])     ->name('realestate.commissions.pay');

    // ── Support Tickets ───────────────────────────────────────────────────────
    Route::get('realestate/support',               [SupportTicketController::class, 'index'])   ->name('realestate.support.index');
    Route::post('realestate/support',              [SupportTicketController::class, 'store'])   ->name('realestate.support.store');
    Route::patch('realestate/support/{ticket}',    [SupportTicketController::class, 'update'])  ->name('realestate.support.update');
    Route::post('realestate/support/{ticket}/resolve', [SupportTicketController::class, 'resolve']) ->name('realestate.support.resolve');

    // ── Condo Fees ────────────────────────────────────────────────────────────
    Route::get('realestate/condo-fees',                      [CondoFeeController::class, 'index'])  ->name('realestate.condo-fees.index');
    Route::post('realestate/condo-fees',                     [CondoFeeController::class, 'store'])  ->name('realestate.condo-fees.store');
    Route::post('realestate/condo-fees/{fee}/pay',           [CondoFeeController::class, 'pay'])    ->name('realestate.condo-fees.pay');

    // ── Lookups ───────────────────────────────────────────────────────────────
    Route::get('realestate/lookup/properties', [PropertyController::class, 'lookup'])          ->name('realestate.lookup.properties');
    Route::get('realestate/lookup/agents',     [RealEstateDealController::class, 'lookupAgents']) ->name('realestate.lookup.agents');
});
