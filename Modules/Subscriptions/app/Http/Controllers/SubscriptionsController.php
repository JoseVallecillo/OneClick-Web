<?php

namespace Modules\Subscriptions\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Settings\Models\Company;
use Modules\Settings\Services\MailConfigurator;
use Modules\Subscriptions\Mail\LicenseTokenMail;
use Modules\Subscriptions\Models\LicenseToken;
use Modules\Subscriptions\Models\Subscription;
use Modules\Subscriptions\Models\SubscriptionPlan;
use Modules\Subscriptions\Services\LicenseTokenService;

class SubscriptionsController extends Controller
{
    public function __construct(private readonly LicenseTokenService $tokenService) {}

    // ── Vista principal ────────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $this->requireAdmin($request);

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

    // ── Generar token y enviar correo ──────────────────────────────────────────

    public function generateToken(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);

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

        MailConfigurator::applyFromDatabase();
        Mail::to($data['recipient_email'])->send(new LicenseTokenMail($token));

        return back()->with('success', "Token generado y enviado a {$data['recipient_email']}. Expira en {$hours} horas.");
    }

    // ── Reenviar correo de token pendiente ─────────────────────────────────────

    public function resendToken(Request $request, LicenseToken $token): RedirectResponse
    {
        $this->requireAdmin($request);

        if (! $token->isPending()) {
            return back()->withErrors(['token' => 'Solo se pueden reenviar tokens pendientes y no expirados.']);
        }

        MailConfigurator::applyFromDatabase();
        Mail::to($token->recipient_email)->send(new LicenseTokenMail($token));

        return back()->with('success', "Correo reenviado a {$token->recipient_email}.");
    }

    // ── Revocar token manualmente ──────────────────────────────────────────────

    public function revokeToken(Request $request, LicenseToken $token): RedirectResponse
    {
        $this->requireAdmin($request);

        if ($token->status !== 'pending') {
            return back()->withErrors(['token' => 'Solo se pueden revocar tokens pendientes.']);
        }

        $token->update(['status' => 'revoked']);

        return back()->with('success', 'Token revocado correctamente.');
    }

    // ── Activar licencia desde enlace del correo ───────────────────────────────

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
        } catch (\RuntimeException $e) {
            return back()->withErrors(['token' => $e->getMessage()]);
        }

        return redirect()->route('subscriptions.index')
            ->with('success', "Licencia activada. Válida hasta {$subscription->ends_at->format('d/m/Y')}.");
    }

    // ── Activación por PIN (solo desarrollo) ──────────────────────────────────

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

        // Desactivar suscripción activa anterior
        Subscription::where('company_id', $request->input('company_id'))
            ->where('is_active', true)
            ->update(['is_active' => false]);

        $plan = SubscriptionPlan::findOrFail($request->input('plan_id'));

        $subscription = Subscription::create([
            'company_id' => $request->input('company_id'),
            'plan_id'    => $plan->id,
            'starts_at'  => now(),
            'ends_at'    => now()->addDays($plan->duration_days),
            'is_active'  => true,
        ]);

        return back()->with('success', "Licencia activada por PIN. Válida hasta {$subscription->ends_at->format('d/m/Y')}.");
    }

    // ── Desactivar suscripción manualmente ────────────────────────────────────

    public function deactivate(Request $request, Subscription $subscription): RedirectResponse
    {
        $this->requireAdmin($request);

        $subscription->update(['is_active' => false]);

        return back()->with('success', 'Suscripción desactivada.');
    }
}
