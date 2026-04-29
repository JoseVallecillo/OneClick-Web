<?php

namespace Modules\Barbershop\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Barbershop\Models\Appointment;
use Modules\Barbershop\Models\Barber;
use Modules\Barbershop\Models\BarbershopQueue;

class BarbershopDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $today = today()->toDateString();
        $month = now()->month;
        $year  = now()->year;

        $todayAppointments = Appointment::with(['barber', 'services'])
            ->where('appointment_date', $today)
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->orderBy('start_time')
            ->get();

        $todayRevenue = Appointment::where('appointment_date', $today)
            ->where('status', 'completed')
            ->sum('total');

        $monthRevenue = Appointment::whereYear('appointment_date', $year)
            ->whereMonth('appointment_date', $month)
            ->where('status', 'completed')
            ->sum('total');

        $monthAppointments = Appointment::whereYear('appointment_date', $year)
            ->whereMonth('appointment_date', $month)
            ->where('status', 'completed')
            ->count();

        $pendingCount = Appointment::where('appointment_date', $today)
            ->whereIn('status', ['pending', 'confirmed'])
            ->count();

        $queueToday = BarbershopQueue::with('barber')
            ->forToday()
            ->orderBy('position')
            ->get();

        $topBarbers = Barber::active()
            ->withCount(['appointments as completed_count' => fn ($q) =>
                $q->whereYear('appointment_date', $year)
                  ->whereMonth('appointment_date', $month)
                  ->where('status', 'completed')
            ])
            ->withSum(['appointments as month_revenue' => fn ($q) =>
                $q->whereYear('appointment_date', $year)
                  ->whereMonth('appointment_date', $month)
                  ->where('status', 'completed')
            ], 'total')
            ->orderByDesc('month_revenue')
            ->limit(5)
            ->get();

        $weekRevenue = collect(range(6, 0))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo)->toDateString();
            $revenue = Appointment::where('appointment_date', $date)
                ->where('status', 'completed')
                ->sum('total');
            return [
                'date'    => $date,
                'label'   => now()->subDays($daysAgo)->locale('es')->isoFormat('ddd D'),
                'revenue' => (float) $revenue,
            ];
        });

        return Inertia::render('Barbershop::Dashboard/Index', [
            'todayAppointments' => $todayAppointments,
            'stats' => [
                'today_revenue'       => (float) $todayRevenue,
                'month_revenue'       => (float) $monthRevenue,
                'month_appointments'  => $monthAppointments,
                'pending_today'       => $pendingCount,
                'queue_count'         => $queueToday->where('status', 'waiting')->count(),
            ],
            'queueToday'   => $queueToday,
            'topBarbers'   => $topBarbers,
            'weekRevenue'  => $weekRevenue,
            'today'        => $today,
        ]);
    }
}
