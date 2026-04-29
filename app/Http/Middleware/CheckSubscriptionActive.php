<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Subscriptions\Services\SubscriptionService;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscriptionActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->company_id) {
            return redirect()->route('subscription-expired');
        }

        $subscriptionService = app(SubscriptionService::class);
        $company = $user->company;

        if (!$company || !$subscriptionService->activeFor($company)) {
            return redirect()->route('subscription-expired');
        }

        return $next($request);
    }
}
