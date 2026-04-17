<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Modules\Settings\Models\Company;
use Modules\Subscriptions\Services\SubscriptionService;

abstract class Controller
{
    /**
     * Aborta con 403 si el usuario autenticado no tiene rol 'admin'.
     */
    protected function requireAdmin(Request $request): void
    {
        if (($request->user()->role ?? 'user') !== 'admin') {
            abort(403, 'Solo los administradores pueden realizar esta acción.');
        }
    }

    /**
     * Aborta con 403 si no existe una suscripción activa.
     * Permite el paso si el módulo Subscriptions no está instalado.
     */
    protected function requireSubscription(): void
    {
        if (! class_exists(SubscriptionService::class) || ! class_exists(Company::class)) {
            return;
        }

        try {
            $company = Company::first();
            $active  = $company ? app(SubscriptionService::class)->activeFor($company) : null;
        } catch (\Throwable) {
            // Tables may not exist yet — allow access
            return;
        }

        if (! $company) {
            abort(403, 'Primero debes registrar tu empresa antes de continuar.');
        }

        if (! $active) {
            abort(403, 'Se requiere una suscripción activa para acceder a esta función. Contacta al administrador del sistema.');
        }
    }

    /**
     * Aborta con 422 si el usuario intenta ejecutar una acción sobre sí mismo.
     */
    protected function preventSelfAction(Request $request, mixed $model, string $message): void
    {
        if (isset($model->id) && $model->id === $request->user()->id) {
            abort(422, $message);
        }
    }
}
