import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

interface SalesEvolutionChartProps {
    data: { date: string; amount: number }[];
    title?: string;
}

export function SalesEvolutionChart({ data, title = "Evolución de Ventas" }: SalesEvolutionChartProps) {
    return (
        <Card className="h-full dark:border-white/10">
            <CardHeader>
                <CardTitle className="text-xl font-bold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
                <div className="h-[300px] w-full pt-4 md:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#888888" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#888888" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid 
                                strokeDasharray="3 3" 
                                vertical={false} 
                                stroke="hsl(var(--muted-foreground))" 
                                opacity={0.1}
                            />
                            <XAxis 
                                dataKey="date" 
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(str) => {
                                    const date = new Date(str);
                                    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                                }}
                                stroke="hsl(var(--muted-foreground))"
                            />
                            <YAxis 
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `L${value}`}
                                stroke="#888888"
                            />
                            <Tooltip 
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                            Fecha
                                                        </span>
                                                        <span className="font-bold text-muted-foreground">
                                                            {payload[0].payload.date}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                            Ventas
                                                        </span>
                                                        <span className="font-bold">
                                                            L{payload[0].value}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#888888"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorSales)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
