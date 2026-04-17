import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string;
    description?: string;
    icon: LucideIcon;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    variant?: 'default' | 'warning' | 'success';
    className?: string;
}

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    variant = 'default',
    className,
}: StatCardProps) {
    return (
        <Card className={cn('overflow-hidden transition-all hover:shadow-md dark:border-white/10', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div 
                    className={cn(
                        "rounded-full p-2 bg-muted/50",
                        variant === 'warning' && "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                        variant === 'success' && "bg-green-500/10 text-green-600 dark:text-green-400",
                        variant === 'default' && "text-foreground"
                    )}
                >
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                {(description || trend) && (
                    <div className="mt-1 flex items-center text-xs">
                        {trend && (
                            <span className={cn(
                                "mr-1 font-medium",
                                trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            )}>
                                {trend.isPositive ? '+' : '-'}{trend.value}
                            </span>
                        )}
                        {description && (
                            <span className="text-muted-foreground">{description}</span>
                        )}
                    </div>
                )}
                {variant === 'warning' && (
                    <div className="mt-4 h-1 w-full bg-orange-500/20">
                        <div className="h-full w-1/3 bg-orange-500" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
