<?php

namespace Modules\Settings\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Settings\Models\Branch;
use Symfony\Component\HttpFoundation\Response;

class SetActiveBranch
{
    /** Routes that must never trigger the branch-selector redirect. */
    private const EXEMPT_ROUTES = [
        'branches.select',
        'branches.set-active',
        'login',
        'logout',
        'register',
        'password.*',
        'verification.*',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()) {
            return $next($request);
        }

        // Skip redirect for exempt routes (selector, auth, etc.)
        if ($this->isExempt($request)) {
            return $next($request);
        }

        $user = $request->user();

        // Si las tablas aún no existen (migraciones pendientes), dejamos pasar
        try {
            $branches = $user->branches()->where('active', true)->get();
        } catch (\Throwable) {
            return $next($request);
        }

        // No branches configured yet — let the request through
        if ($branches->isEmpty()) {
            return $next($request);
        }

        $sessionBranchId = session('active_branch_id');

        // Validate the session branch still belongs to the user
        if ($sessionBranchId) {
            if ($branches->contains('id', $sessionBranchId)) {
                return $next($request);
            }
            // Branch no longer valid — clear and re-evaluate
            session()->forget('active_branch_id');
        }

        // Auto-assign when user has exactly one branch
        if ($branches->count() === 1) {
            session(['active_branch_id' => $branches->first()->id]);
            return $next($request);
        }

        // Multiple branches and none selected — redirect to selector
        return redirect()->route('branches.select');
    }

    private function isExempt(Request $request): bool
    {
        foreach (self::EXEMPT_ROUTES as $route) {
            if ($request->routeIs($route)) {
                return true;
            }
        }

        return false;
    }
}
