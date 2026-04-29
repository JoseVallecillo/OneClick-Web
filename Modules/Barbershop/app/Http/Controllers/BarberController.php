<?php

namespace Modules\Barbershop\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Barbershop\Models\Barber;
use Modules\Barbershop\Models\BarberSchedule;
use Modules\Barbershop\Models\BarberTimeBlock;

class BarberController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $query = Barber::withCount('appointments');

        if ($request->has('active') && $request->input('active') !== '') {
            $query->where('active', filter_var($request->input('active'), FILTER_VALIDATE_BOOLEAN));
        }

        $barbers = $query->orderBy('name')->get();

        return Inertia::render('Barbershop::Barbers/Index', [
            'barbers' => $barbers,
            'filters' => $request->only(['active']),
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Barbershop::Barbers/Form', [
            'barber'    => null,
            'schedules' => [],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'             => ['required', 'string', 'max:150'],
            'email'            => ['nullable', 'email', 'max:150'],
            'phone'            => ['nullable', 'string', 'max:30'],
            'bio'              => ['nullable', 'string', 'max:1000'],
            'color'            => ['required', 'string', 'size:7'],
            'commission_rate'  => ['required', 'numeric', 'min:0', 'max:100'],
            'accepts_walk_ins' => ['boolean'],
            'active'           => ['boolean'],
            'schedules'        => ['nullable', 'array'],
            'schedules.*.day_of_week'  => ['required', 'integer', 'min:0', 'max:6'],
            'schedules.*.is_working'   => ['boolean'],
            'schedules.*.start_time'   => ['nullable', 'date_format:H:i'],
            'schedules.*.end_time'     => ['nullable', 'date_format:H:i'],
            'schedules.*.break_start'  => ['nullable', 'date_format:H:i'],
            'schedules.*.break_end'    => ['nullable', 'date_format:H:i'],
        ]);

        $barber = DB::transaction(function () use ($data) {
            $barber = Barber::create([
                'name'             => $data['name'],
                'email'            => $data['email'] ?? null,
                'phone'            => $data['phone'] ?? null,
                'bio'              => $data['bio'] ?? null,
                'color'            => $data['color'],
                'commission_rate'  => $data['commission_rate'],
                'accepts_walk_ins' => $data['accepts_walk_ins'] ?? true,
                'active'           => $data['active'] ?? true,
            ]);

            foreach ($data['schedules'] ?? [] as $sch) {
                BarberSchedule::create([
                    'barber_id'   => $barber->id,
                    'day_of_week' => $sch['day_of_week'],
                    'is_working'  => $sch['is_working'] ?? false,
                    'start_time'  => $sch['is_working'] ? ($sch['start_time'] ?? null) : null,
                    'end_time'    => $sch['is_working'] ? ($sch['end_time'] ?? null) : null,
                    'break_start' => $sch['is_working'] ? ($sch['break_start'] ?? null) : null,
                    'break_end'   => $sch['is_working'] ? ($sch['break_end'] ?? null) : null,
                ]);
            }

            return $barber;
        });

        return redirect()->route('barbershop.barbers.show', $barber)
            ->with('success', "Barbero {$barber->name} creado correctamente.");
    }

    public function show(Request $request, Barber $barber): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $barber->load(['schedules', 'timeBlocks' => fn ($q) =>
            $q->where('block_date', '>=', today()->toDateString())->orderBy('block_date')
        ]);

        $recentAppointments = $barber->appointments()
            ->with(['client', 'services'])
            ->orderByDesc('appointment_date')
            ->limit(10)
            ->get();

        $monthStats = [
            'revenue'      => (float) $barber->totalRevenueForMonth(now()->year, now()->month),
            'appointments' => $barber->appointmentsCountForMonth(now()->year, now()->month),
        ];

        return Inertia::render('Barbershop::Barbers/Show', [
            'barber'             => $barber,
            'recentAppointments' => $recentAppointments,
            'monthStats'         => $monthStats,
        ]);
    }

    public function edit(Request $request, Barber $barber): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $barber->load('schedules');

        return Inertia::render('Barbershop::Barbers/Form', [
            'barber'    => $barber,
            'schedules' => $barber->schedules,
        ]);
    }

    public function update(Request $request, Barber $barber): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'             => ['required', 'string', 'max:150'],
            'email'            => ['nullable', 'email', 'max:150'],
            'phone'            => ['nullable', 'string', 'max:30'],
            'bio'              => ['nullable', 'string', 'max:1000'],
            'color'            => ['required', 'string', 'size:7'],
            'commission_rate'  => ['required', 'numeric', 'min:0', 'max:100'],
            'accepts_walk_ins' => ['boolean'],
            'active'           => ['boolean'],
            'schedules'        => ['nullable', 'array'],
            'schedules.*.day_of_week'  => ['required', 'integer', 'min:0', 'max:6'],
            'schedules.*.is_working'   => ['boolean'],
            'schedules.*.start_time'   => ['nullable', 'date_format:H:i'],
            'schedules.*.end_time'     => ['nullable', 'date_format:H:i'],
            'schedules.*.break_start'  => ['nullable', 'date_format:H:i'],
            'schedules.*.break_end'    => ['nullable', 'date_format:H:i'],
        ]);

        DB::transaction(function () use ($barber, $data) {
            $barber->update([
                'name'             => $data['name'],
                'email'            => $data['email'] ?? null,
                'phone'            => $data['phone'] ?? null,
                'bio'              => $data['bio'] ?? null,
                'color'            => $data['color'],
                'commission_rate'  => $data['commission_rate'],
                'accepts_walk_ins' => $data['accepts_walk_ins'] ?? true,
                'active'           => $data['active'] ?? true,
            ]);

            $barber->schedules()->delete();
            foreach ($data['schedules'] ?? [] as $sch) {
                BarberSchedule::create([
                    'barber_id'   => $barber->id,
                    'day_of_week' => $sch['day_of_week'],
                    'is_working'  => $sch['is_working'] ?? false,
                    'start_time'  => $sch['is_working'] ? ($sch['start_time'] ?? null) : null,
                    'end_time'    => $sch['is_working'] ? ($sch['end_time'] ?? null) : null,
                    'break_start' => $sch['is_working'] ? ($sch['break_start'] ?? null) : null,
                    'break_end'   => $sch['is_working'] ? ($sch['break_end'] ?? null) : null,
                ]);
            }
        });

        return back()->with('success', 'Barbero actualizado correctamente.');
    }

    public function destroy(Request $request, Barber $barber): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $name = $barber->name;
        $barber->delete();

        return redirect()->route('barbershop.barbers.index')
            ->with('success', "Barbero {$name} eliminado.");
    }

    public function storeTimeBlock(Request $request, Barber $barber): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'block_date' => ['required', 'date'],
            'full_day'   => ['boolean'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time'   => ['nullable', 'date_format:H:i'],
            'reason'     => ['nullable', 'string', 'max:200'],
        ]);

        BarberTimeBlock::create(array_merge($data, ['barber_id' => $barber->id]));

        return back()->with('success', 'Bloqueo de tiempo registrado.');
    }

    public function destroyTimeBlock(Request $request, Barber $barber, BarberTimeBlock $block): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        abort_if($block->barber_id !== $barber->id, 403);
        $block->delete();

        return back()->with('success', 'Bloqueo eliminado.');
    }
}
