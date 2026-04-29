<?php

namespace Modules\Pos\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Pos\Models\PosWaiter;

class PosWaiterController extends Controller
{
    public function index(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $waiters = PosWaiter::orderBy('name')->get();

        return Inertia::render('Pos::Waiters/Index', [
            'waiters' => $waiters,
        ]);
    }

    public function create(Request $request): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Pos::Waiters/Form', [
            'waiter' => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'   => ['required', 'string', 'max:100'],
            'code'   => ['nullable', 'string', 'max:20', 'unique:pos_waiters,code'],
            'active' => ['boolean'],
        ]);

        PosWaiter::create([...$data, 'created_by' => Auth::id()]);

        return redirect()->route('pos.waiters.index')
            ->with('success', 'Mesero creado correctamente.');
    }

    public function edit(Request $request, PosWaiter $waiter): Response
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        return Inertia::render('Pos::Waiters/Form', [
            'waiter' => $waiter,
        ]);
    }

    public function update(Request $request, PosWaiter $waiter): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $data = $request->validate([
            'name'   => ['required', 'string', 'max:100'],
            'code'   => ['nullable', 'string', 'max:20', "unique:pos_waiters,code,{$waiter->id}"],
            'active' => ['boolean'],
        ]);

        $waiter->update($data);

        return redirect()->route('pos.waiters.index')
            ->with('success', 'Mesero actualizado correctamente.');
    }

    public function destroy(Request $request, PosWaiter $waiter): RedirectResponse
    {
        $this->requireAdmin($request);
        $this->requireSubscription();

        $waiter->delete();

        return redirect()->route('pos.waiters.index')
            ->with('success', 'Mesero eliminado correctamente.');
    }
}
