<?php

namespace Modules\Subscriptions\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Subscriptions\Services\SubscriptionService;

class SubscriptionExpiredController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();
        $company = $user?->company;
        $subscriptionService = app(SubscriptionService::class);
        $subscription = $company ? $subscriptionService->activeFor($company) : null;

        return Inertia::render('Subscriptions::Expired', [
            'company_name' => $company?->commercial_name ?? 'Tu empresa',
            'has_subscription' => $subscription !== null,
            'subscription_data' => $subscriptionService->shareData($company),
        ]);
    }
}
