<?php

namespace Modules\Subscriptions\Services;

use App\Models\User;
use Modules\Subscriptions\Models\SubscriptionsAuditLog;

class SubscriptionsAuditService
{
    public static function logTokenGeneration(
        User $user,
        int $companyId,
        int $planId,
        string $recipientEmail,
        int $expiresHours
    ): void {
        SubscriptionsAuditLog::create([
            'user_id'     => $user->id,
            'entity_type' => 'license_token',
            'entity_id'   => null,
            'action'      => 'generate',
            'old_values'  => null,
            'new_values'  => json_encode([
                'company_id'      => $companyId,
                'plan_id'         => $planId,
                'recipient_email' => $recipientEmail,
                'expires_hours'   => $expiresHours,
            ]),
            'reason'      => null,
            'ip_address'  => request()->ip(),
            'created_at'  => now(),
        ]);
    }

    public static function logTokenResend(
        User $user,
        int $tokenId,
        string $recipientEmail
    ): void {
        SubscriptionsAuditLog::create([
            'user_id'     => $user->id,
            'entity_type' => 'license_token',
            'entity_id'   => $tokenId,
            'action'      => 'resend',
            'old_values'  => null,
            'new_values'  => json_encode(['recipient_email' => $recipientEmail]),
            'reason'      => null,
            'ip_address'  => request()->ip(),
            'created_at'  => now(),
        ]);
    }

    public static function logTokenRevocation(
        User $user,
        int $tokenId,
        ?string $reason = null
    ): void {
        SubscriptionsAuditLog::create([
            'user_id'     => $user->id,
            'entity_type' => 'license_token',
            'entity_id'   => $tokenId,
            'action'      => 'revoke',
            'old_values'  => null,
            'new_values'  => null,
            'reason'      => $reason,
            'ip_address'  => request()->ip(),
            'created_at'  => now(),
        ]);
    }

    public static function logSubscriptionActivation(
        ?User $user,
        int $subscriptionId,
        int $companyId,
        int $planId,
        string $activationType = 'token'
    ): void {
        SubscriptionsAuditLog::create([
            'user_id'     => $user?->id,
            'entity_type' => 'subscription',
            'entity_id'   => $subscriptionId,
            'action'      => 'create',
            'old_values'  => null,
            'new_values'  => json_encode([
                'company_id'      => $companyId,
                'plan_id'         => $planId,
                'activation_type' => $activationType,
            ]),
            'reason'      => null,
            'ip_address'  => request()->ip(),
            'created_at'  => now(),
        ]);
    }

    public static function logSubscriptionDeactivation(
        User $user,
        int $subscriptionId,
        ?string $reason = null
    ): void {
        SubscriptionsAuditLog::create([
            'user_id'     => $user->id,
            'entity_type' => 'subscription',
            'entity_id'   => $subscriptionId,
            'action'      => 'deactivate',
            'old_values'  => null,
            'new_values'  => null,
            'reason'      => $reason,
            'ip_address'  => request()->ip(),
            'created_at'  => now(),
        ]);
    }

    public static function logSubscriptionExpiration(
        int $subscriptionId,
        int $companyId,
        int $planId
    ): void {
        SubscriptionsAuditLog::create([
            'user_id'     => null,
            'entity_type' => 'subscription',
            'entity_id'   => $subscriptionId,
            'action'      => 'expire',
            'old_values'  => null,
            'new_values'  => json_encode([
                'company_id' => $companyId,
                'plan_id'    => $planId,
            ]),
            'reason'      => 'Automatic expiration',
            'ip_address'  => null,
            'created_at'  => now(),
        ]);
    }

    public static function logTokenExpiration(
        int $tokenId,
        int $companyId,
        int $planId
    ): void {
        SubscriptionsAuditLog::create([
            'user_id'     => null,
            'entity_type' => 'license_token',
            'entity_id'   => $tokenId,
            'action'      => 'expire',
            'old_values'  => null,
            'new_values'  => json_encode([
                'company_id' => $companyId,
                'plan_id'    => $planId,
            ]),
            'reason'      => 'Automatic expiration',
            'ip_address'  => null,
            'created_at'  => now(),
        ]);
    }
}
