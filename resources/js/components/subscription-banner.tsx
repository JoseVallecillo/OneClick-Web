import { usePage } from '@inertiajs/react';
import { AlertTriangle, XCircle } from 'lucide-react';

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

export function SubscriptionBanner() {
    const { auth } = usePage<SharedProps>().props;
    const sub = auth?.subscription;

    // Sin datos de suscripción → no mostrar nada
    if (!sub) return null;

    const isExpired   = sub.is_expired;
    const isWarning   = !isExpired && sub.days_remaining <= 10;

    // Suscripción vigente con más de 10 días → no mostrar banner
    if (!isExpired && !isWarning) return null;

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

    // Warning (≤ 10 días)
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
