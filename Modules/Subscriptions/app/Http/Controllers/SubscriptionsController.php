<?php

namespace Modules\Subscriptions\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Settings\Models\Company;
use Modules\Settings\Services\MailConfigurator;
use Modules\Subscriptions\Mail\LicenseTokenMail;
use Modules\Subscriptions\Models\LicenseToken;
use Modules\Subscriptions\Models\Subscription;
use Modules\Subscriptions\Models\SubscriptionPlan;
use Modules\Subscriptions\Services\LicenseTokenService;
use Modules\Subscriptions\Services\SubscriptionsAuditService;
use Modules\Subscriptions\Services\SubscriptionsPermissionService;

class SubscriptionsController extends Controller
{
    private const TOKEN_GENERATION_RATE_LIMIT = 20;

    public function __construct(private readonly LicenseTokenService $tokenService) {}

    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        SubscriptionsPermissionService::ensurePermission($request->user(), 'subscriptions.view');

        $companies = Company::orderBy('commercial_name')->get(['id', 'commercial_name', 'legal_name']);

        $plans = SubscriptionPlan::where('active', true)
            ->orderBy('duration_days')
            ->get(['id', 'name', 'user_limit', 'duration_days']);

        $subscriptions = Subscription::with(['company:id,commercial_name', 'plan:id,name,user_limit,duration_days'])
            ->orderByDesc('created_at')
            ->get();

        $tokens = LicenseToken::with(['company:id,commercial_name', 'plan:id,name', 'creator:id,name'])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get(['id', 'company_id', 'plan_id', 'created_by', 'recipient_email', 'expires_at', 'used_at', 'status', 'created_at']);

        return Inertia::render('Subscriptions::Index', [
            'companies'      => $companies,
            'plans'          => $plans,
            'subscriptions'  => $subscriptions,
            'tokens'         => $tokens,
            'dev_pin_enabled' => ! empty(config('app.dev_license_pin')),
        ]);
    }

    public function generateToken(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        SubscriptionsPermissionService::ensurePermission($request->user(), 'subscriptions.tokens.create');

        $key = 'subscriptions:generate-token:' . $request->user()->id;
        if (RateLimiter::tooManyAttempts($key, self::TOKEN_GENERATION_RATE_LIMIT)) {
            return back()->withErrors(['token' => 'Demasiadas solicitudes. Intente más tarde.']);
        }

        RateLimiter::hit($key, 60);

        $data = $request->validate([
            'company_id'      => ['required', 'integer', 'exists:companies,id'],
            'plan_id'         => ['required', 'integer', 'exists:subscription_plans,id'],
            'recipient_email' => ['required', 'email', 'max:255'],
            'expires_hours'   => ['nullable', 'integer', 'min:1', 'max:720'],
        ]);

        $company = Company::findOrFail($data['company_id']);
        $plan    = SubscriptionPlan::findOrFail($data['plan_id']);
        $hours   = $data['expires_hours'] ?? 48;

        $token = $this->tokenService->generate(
            $company,
            $plan,
            $request->user(),
            $data['recipient_email'],
            $hours,
        );

        SubscriptionsAuditService::logTokenGeneration(
            $request->user(),
            $company->id,
            $plan->id,
            $data['recipient_email'],
            $hours,
        );

        MailConfigurator::applyFromDatabase();
        Mail::to($data['recipient_email'])->send(new LicenseTokenMail($token));

        return back()->with('success', "Token generado y enviado a {$data['recipient_email']}. Expira en {$hours} horas.");
    }

    public function resendToken(Request $request, LicenseToken $token): RedirectResponse
    {
        $this->requireAdmin($request);
        SubscriptionsPermissionService::ensurePermission($request->user(), 'subscriptions.tokens.resend');

        if (! $token->isPending()) {
            return back()->withErrors(['token' => 'Solo se pueden reenviar tokens pendientes y no expirados.']);
        }

        SubscriptionsAuditService::logTokenResend(
            $request->user(),
            $token->id,
            $token->recipient_email,
        );

        MailConfigurator::applyFromDatabase();
        Mail::to($token->recipient_email)->send(new LicenseTokenMail($token));

        return back()->with('success', "Correo reenviado a {$token->recipient_email}.");
    }

    public function revokeToken(Request $request, LicenseToken $token): RedirectResponse
    {
        $this->requireAdmin($request);
        SubscriptionsPermissionService::ensurePermission($request->user(), 'subscriptions.tokens.revoke');

        if ($token->status !== 'pending') {
            return back()->withErrors(['token' => 'Solo se pueden revocar tokens pendientes.']);
        }

        $token->update(['status' => 'revoked']);

        SubscriptionsAuditService::logTokenRevocation(
            $request->user(),
            $token->id,
            'Manual revocation',
        );

        return back()->with('success', 'Token revocado correctamente.');
    }

    public function showActivate(Request $request, string $token): Response
    {
        $record = LicenseToken::with(['company:id,commercial_name', 'plan:id,name,duration_days,user_limit'])
            ->where('token', $token)
            ->first();

        if (! $record || ! $record->isPending()) {
            $reason = match (true) {
                ! $record                     => 'Token no encontrado.',
                $record->status === 'used'    => 'Este token ya fue utilizado.',
                $record->status === 'revoked' => 'Este token fue revocado.',
                default                       => 'Este token ha expirado.',
            };

            return Inertia::render('Subscriptions::Activate', [
                'token'  => null,
                'record' => null,
                'error'  => $reason,
            ]);
        }

        return Inertia::render('Subscriptions::Activate', [
            'token'  => $token,
            'record' => $record,
            'error'  => null,
        ]);
    }

    public function activate(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
        ]);

        try {
            $subscription = $this->tokenService->activate($request->input('token'));
        } catch (ModelNotFoundException) {
            return back()->withErrors(['token' => 'Token no encontrado.']);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['token' => $e->getMessage()]);
        }

        SubscriptionsAuditService::logSubscriptionActivation(
            $request->user(),
            $subscription->id,
            $subscription->company_id,
            $subscription->plan_id,
            'token',
        );

        return redirect()->route('subscriptions.index')
            ->with('success', "Licencia activada. Válida hasta {$subscription->ends_at->format('d/m/Y')}.");
    }

    public function activateByPin(Request $request): RedirectResponse
    {
        $devPin = config('app.dev_license_pin');

        if (! $devPin) {
            return back()->withErrors(['pin' => 'La activación por PIN no está habilitada en este entorno.']);
        }

        $request->validate([
            'pin'        => ['required', 'string'],
            'company_id' => ['required', 'integer', 'exists:companies,id'],
            'plan_id'    => ['required', 'integer', 'exists:subscription_plans,id'],
        ]);

        if ($request->input('pin') !== (string) $devPin) {
            return back()->withErrors(['pin' => 'PIN incorrecto.']);
        }

        try {
            $subscription = $this->tokenService->createSubscription(
                $request->input('company_id'),
                $request->input('plan_id'),
            );
        } catch (ModelNotFoundException) {
            return back()->withErrors(['pin' => 'Plan no encontrado.']);
        }

        SubscriptionsAuditService::logSubscriptionActivation(
            $request->user(),
            $subscription->id,
            $subscription->company_id,
            $subscription->plan_id,
            'pin',
        );

        return back()->with('success', "Licencia activada por PIN. Válida hasta {$subscription->ends_at->format('d/m/Y')}.");
    }

    public function deactivate(Request $request, Subscription $subscription): RedirectResponse
    {
        $this->requireAdmin($request);
        SubscriptionsPermissionService::ensurePermission($request->user(), 'subscriptions.deactivate');

        $subscription->update(['is_active' => false]);

        SubscriptionsAuditService::logSubscriptionDeactivation(
            $request->user(),
            $subscription->id,
            'Manual deactivation',
        );

        return back()->with('success', 'Suscripción desactivada.');
    }
}
