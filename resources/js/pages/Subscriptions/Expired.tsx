import { AlertTriangle, ArrowRight, Calendar, Shield } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SubscriptionData {
    plan_name: string | null;
    days_remaining: number;
    is_expired: boolean;
    user_limit: number | null;
    is_unlimited: boolean;
}

interface Props {
    company_name: string;
    has_subscription: boolean;
    subscription_data: SubscriptionData | null;
}

export default function Expired({ company_name, has_subscription, subscription_data }: Props) {
    const { auth } = usePage().props;

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-2xl border-red-200">
                <div className="p-8 text-center">
                    {/* Header Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-red-100 p-4 rounded-full">
                            <AlertTriangle className="w-12 h-12 text-red-600" />
                        </div>
                    </div>

                    {/* Main Message */}
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Licencia Expirada
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Tu licencia para <strong>{company_name}</strong> ha expirado y no puedes acceder a los módulos.
                    </p>

                    {/* Subscription Details (if available) */}
                    {subscription_data && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
                            {subscription_data.plan_name && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Plan:</span>
                                    <span className="font-semibold text-gray-900">
                                        {subscription_data.plan_name}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Estado:</span>
                                <span className="font-semibold text-red-600">
                                    Vencida hace {Math.abs(subscription_data.days_remaining)} día(s)
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-left">
                        <div className="flex gap-3">
                            <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                    ¿Qué sucede ahora?
                                </p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• No puedes crear ni editar registros</li>
                                    <li>• No puedes acceder a ningún módulo</li>
                                    <li>• Tus datos están seguros y respaldados</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <a
                        href={route('subscriptions.index')}
                        className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition mb-4 gap-2"
                    >
                        <Calendar className="w-5 h-5" />
                        Renovar Licencia
                        <ArrowRight className="w-4 h-4" />
                    </a>

                    {/* Footer Info */}
                    <p className="text-xs text-gray-500 mt-6">
                        Contacta al administrador para más detalles sobre renovación
                    </p>

                    {/* User Info */}
                    <div className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500">
                        <p>
                            <strong>Usuario:</strong> {auth.user.name}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
