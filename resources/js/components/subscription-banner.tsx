import { usePage } from '@inertiajs/react';
import { AlertTriangle, FlaskConical, XCircle } from 'lucide-react';

interface SubscriptionData {
    plan_name: string | null;
    days_remaining: number;
    is_expired: boolean;
    user_limit: number | null;
    is_unlimited: boolean;
}

interface SharedProps {
    auth: {
        subscription?: SubscriptionData | null;
    };
}

const TRIAL_PLAN = 'Básico';

export function SubscriptionBanner() {
    const { auth } = usePage<SharedProps>().props;
    const sub = auth?.subscription;

    if (!sub) return null;

    const isExpired = sub.is_expired;
    const isTrial   = sub.plan_name === TRIAL_PLAN;
    const isWarning = !isExpired && !isTrial && sub.days_remaining <= 10;

    if (isExpired) {
        return (
            <div className="flex items-center gap-3 bg-red-600 px-4 py-2.5 text-white text-sm">
                <XCircle className="h-4 w-4 shrink-0" />
                <span className="font-medium">Licencia vencida.</span>
                <span className="opacity-90">
                    El sistema está en modo de solo lectura. Contacta a tu administrador para renovar la suscripción.
                </span>
            </div>
        );
    }

    if (isTrial) {
        return (
            <div className="flex items-center gap-3 bg-violet-600 px-4 py-2.5 text-white text-sm">
                <FlaskConical className="h-4 w-4 shrink-0" />
                <span className="font-semibold uppercase tracking-wide text-xs">Versión Demo</span>
                <span className="opacity-90">
                    Estás usando una licencia de prueba de 30 días.
                    {sub.days_remaining > 0
                        ? ` Quedan ${sub.days_remaining} día${sub.days_remaining === 1 ? '' : 's'}.`
                        : ' Vence hoy.'}
                    {' '}Contacta al proveedor para activar tu licencia completa.
                </span>
            </div>
        );
    }

    if (isWarning) {
        return (
            <div className="flex items-center gap-3 bg-amber-400 px-4 py-2.5 text-amber-900 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="font-medium">Tu licencia vence pronto.</span>
                <span>
                    {sub.days_remaining === 0
                        ? 'Vence hoy.'
                        : `Quedan ${sub.days_remaining} día${sub.days_remaining === 1 ? '' : 's'} del plan ${sub.plan_name ?? ''}.`}
                    {' '}Comunícate con el administrador para renovar.
                </span>
            </div>
        );
    }

    return null;
}
