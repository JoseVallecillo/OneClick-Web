<?php

namespace Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Accounting\Models\AccountingPeriod;

class AccountingPeriodController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $periods = AccountingPeriod::orderBy('date_from', 'desc')->paginate(50);

        return Inertia::render('Accounting::Periods/Index', [
            'periods' => $periods,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::Periods/Form');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'      => ['required', 'string', 'max:100'],
            'date_from' => ['required', 'date'],
            'date_to'   => ['required', 'date', 'after:date_from'],
        ]);

        AccountingPeriod::create($data);

        return redirect()->route('accounting.periods.index')
            ->with('success', "Período {$data['name']} creado.");
    }

    public function edit(Request $request, AccountingPeriod $period): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Accounting::Periods/Form', [
            'period' => $period,
        ]);
    }

    public function update(Request $request, AccountingPeriod $period): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'      => ['required', 'string', 'max:100'],
            'date_from' => ['required', 'date'],
            'date_to'   => ['required', 'date', 'after:date_from'],
        ]);

        $period->update($data);

        return redirect()->route('accounting.periods.index')
            ->with('success', "Período {$period->name} actualizado.");
    }

    public function close(Request $request, AccountingPeriod $period): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'closing_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $period->update([
            'state' => 'closed',
            'closed_at' => now(),
            'closed_by' => auth()->id(),
            'closing_notes' => $data['closing_notes'] ?? null,
        ]);

        return redirect()->route('accounting.periods.index')
            ->with('success', "Período {$period->name} cerrado.");
    }
}
