import { SalesEvolutionChart } from '@/components/dashboard/sales-evolution-chart';
import { StatCard } from '@/components/dashboard/stat-card';
import { dashboard } from '@/routes';
import { Head } from '@inertiajs/react';
import { TrendingUp, AlertCircle, Wallet } from 'lucide-react';

// Generar datos ficticios para los últimos 30 días
const chartData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 500) + 1000 + (i * 20), // Tendencia ligeramente ascendente
    };
});

export default function Dashboard() {
    return (
        <>
            <Head title="Panel de Control" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Métricas Superiores */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <StatCard 
                        title="Ventas del Mes"
                        value="L45,231.89"
                        description="vs mes anterior"
                        icon={TrendingUp}
                        trend={{ value: '12.5%', isPositive: true }}
                    />
                    <StatCard 
                        title="Pendiente de Cobro"
                        value="L12,234.00"
                        description="4 facturas por vencer"
                        icon={AlertCircle}
                        variant="warning"
                    />
                    <StatCard 
                        title="Utilidad"
                        value="L32,997.89"
                        description="Margen operativo"
                        icon={Wallet}
                        variant="success"
                        trend={{ value: '8.2%', isPositive: true }}
                    />
                </div>

                {/* Gráfico Principal */}
                <div className="min-h-[400px] flex-1">
                    <SalesEvolutionChart data={chartData} />
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Panel de Control',
            href: dashboard(),
        },
    ],
};
