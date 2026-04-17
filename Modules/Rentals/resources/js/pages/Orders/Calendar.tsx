import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    Info, 
    Package, 
    Plus,
    User
} from 'lucide-react';
import { useMemo } from 'react';

interface RentalOrderLine {
    id: number;
    product: {
        name: string;
    };
}

interface RentalOrder {
    id: number;
    reference: string;
    customer: {
        name: string;
    };
    status: string;
    start_date: string;
    end_date: string;
    total: string;
    lines: RentalOrderLine[];
}

interface Props {
    orders: RentalOrder[];
    from: string;
    to: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Alquileres', href: '/rentals' },
    { title: 'Calendario', href: '/rentals/calendar' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    confirmed: { label: 'Confirmada', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', dot: 'bg-blue-500' },
    active:    { label: 'En Curso',   color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-500' },
    returned:  { label: 'Retornado',  color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
};

export default function RentalCalendar({ orders, from, to }: Props) {
    const pivotDate = useMemo(() => new Date(from + 'T00:00:00'), [from]);
    const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const { calendarDays, monthName, year } = useMemo(() => {
        const d = new Date(pivotDate);
        const year = d.getFullYear();
        const month = d.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const mName = firstDay.toLocaleString('es-ES', { month: 'long' });
        
        let startingDay = firstDay.getDay() - 1;
        if (startingDay === -1) startingDay = 6;
        
        const days = [];
        for (let i = 0; i < startingDay; i++) days.push(null);
        for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
        
        return { calendarDays: days, monthName: mName.charAt(0).toUpperCase() + mName.slice(1), year };
    }, [pivotDate]);

    const navigate = (direction: 'prev' | 'next' | 'today') => {
        let newDate = new Date(pivotDate);
        if (direction === 'prev') newDate.setMonth(newDate.getMonth() - 1);
        else if (direction === 'next') newDate.setMonth(newDate.getMonth() + 1);
        else newDate = new Date();
        
        const f = new Date(newDate.getFullYear(), newDate.getMonth(), 1).toISOString().split('T')[0];
        const t = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).toISOString().split('T')[0];
        
        router.visit(`/rentals/calendar?from=${f}&to=${t}`, { preserveState: true, replace: true });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() && 
               date.getMonth() === today.getMonth() && 
               date.getFullYear() === today.getFullYear();
    };

    const getOrdersForDay = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return orders.filter(o => dateStr >= o.start_date && dateStr <= o.end_date);
    };

    return (
        <>
            <Head title="Calendario de Alquileres" />
            
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <CalendarIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Calendario de Alquileres</h1>
                            <p className="text-sm text-muted-foreground">{monthName} {year}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg border border-border bg-card p-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('prev')}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-semibold" onClick={() => navigate('today')}>
                                Hoy
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('next')}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                        <Link href="/rentals/orders/create">
                            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm shadow-primary/20">
                                <Plus className="mr-1.5 h-4 w-4" />
                                Nueva Orden
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex-1 min-h-[600px] flex flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                        {DAYS.map(day => (
                            <div key={day} className="px-4 py-3 text-center text-xs font-bold text-muted-foreground tracking-wider uppercase">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                        {calendarDays.map((date, idx) => (
                            <div key={idx} className={`min-h-[100px] border-r border-b border-border p-2 transition-colors ${!date ? 'bg-muted/10' : 'hover:bg-muted/5'}`}
                                style={{ borderRightWidth: (idx + 1) % 7 === 0 ? 0 : 1 }}>
                                {date && (
                                    <div className="flex flex-col h-full gap-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`flex items-center justify-center h-7 w-7 text-sm font-semibold rounded-full ${isToday(date) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                                                {date.getDate()}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1 overflow-y-auto max-h-[120px] custom-scrollbar">
                                            {getOrdersForDay(date).map(order => {
                                                const config = STATUS_CONFIG[order.status] || { dot: 'bg-slate-500', color: 'bg-slate-500/10' };
                                                const isStart = order.start_date === date.toISOString().split('T')[0];
                                                return (
                                                    <Link key={order.id} href={`/rentals/${order.id}`}
                                                        className={`group relative flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border transition-all hover:scale-[1.02] active:scale-[0.98] ${config.color}`}>
                                                        <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dot}`} />
                                                        <span className="truncate">{isStart ? order.customer.name : order.reference}</span>
                                                        <div className="invisible group-hover:visible absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 rounded-lg bg-popover text-popover-foreground border border-border shadow-xl w-48 pointer-events-none">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center justify-between border-b border-border pb-1 mb-1">
                                                                    <span className="font-bold text-xs">#{order.reference}</span>
                                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{config.label}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-xs text-foreground">
                                                                    <User className="h-3 w-3 text-muted-foreground" />
                                                                    <span className="truncate">{order.customer.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                                    <Clock className="h-3 w-3" />
                                                                    <span>{order.start_date} → {order.end_date}</span>
                                                                </div>
                                                            </div>
                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-popover" />
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 px-4 py-3 rounded-xl border border-border bg-card">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Leyenda:</span>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <div key={key} className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
                            <span className="text-xs font-semibold text-foreground/80">{config.label}</span>
                        </div>
                    ))}
                    <div className="ml-auto flex items-center gap-4 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            <span>Haz clic en una reserva para ver el detalle completo.</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
            `}} />
        </>
    );
}

RentalCalendar.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
